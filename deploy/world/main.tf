terraform {
  required_version = ">= 1.14"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 6.0" } }
}
provider "aws" {
  region              = "us-east-1"
  allowed_account_ids = ["240851517002"]
}
variable "enable_tls" {
  type    = bool
  default = false
}
variable "web_image_digest" { type = string }
variable "tls_image_digest" { type = string }
variable "public_supabase_url" { type = string }
variable "public_supabase_anon_key" { type = string }
variable "service_role_parameter_arn" { type = string }
variable "openai_parameter_arn" { type = string }
variable "secret_kms_key_arn" { type = string }
# No secret values are accepted or provisioned by this configuration.
data "aws_ecs_cluster" "world" { cluster_name = "world" }
resource "aws_ecr_repository" "images" {
  for_each             = toset(["fitness-world-web", "fitness-world-tls"])
  name                 = each.value
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration { scan_on_push = true }
  encryption_configuration { encryption_type = "AES256" }
}
resource "aws_cloudwatch_log_group" "fitness" {
  name              = "/ecs-world/fitness-production"
  retention_in_days = 14
}
locals {
  task_trust = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}
resource "aws_iam_role" "execution" {
  name               = "fitness-world-execution"
  assume_role_policy = local.task_trust
}
resource "aws_iam_role_policy" "execution" {
  role = aws_iam_role.execution.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage"], Resource = [for r in aws_ecr_repository.images : r.arn] },
    { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.fitness.arn}:*" },
    { Effect = "Allow", Action = ["ssm:GetParameters"], Resource = [var.service_role_parameter_arn, var.openai_parameter_arn] },
    { Effect = "Allow", Action = ["kms:Decrypt"], Resource = var.secret_kms_key_arn, Condition = { StringEquals = { "kms:ViaService" = "ssm.us-east-1.amazonaws.com" } } }
  ] })
}
resource "aws_iam_role" "task" {
  name               = "fitness-world-task"
  assume_role_policy = local.task_trust
  # No AWS grants on this role; shared-node isolation still requires IMDS checks.
}
resource "aws_ecs_task_definition" "fitness" {
  family                   = "fitness-production"
  requires_compatibilities = ["EC2"]
  network_mode             = "bridge"
  cpu                      = "256"
  memory                   = "768"
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn
  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  volume {
    name = "fitness-tls-data"
    docker_volume_configuration {
      scope         = "shared"
      autoprovision = true
      driver        = "local"
    }
  }
  container_definitions = jsonencode(concat([
    {
      name             = "web", image = "${aws_ecr_repository.images["fitness-world-web"].repository_url}@${var.web_image_digest}", essential = true,
      cpu              = 224, memory = 512, memoryReservation = 128,
      environment      = [{ name = "NODE_ENV", value = "production" }, { name = "HOSTNAME", value = "0.0.0.0" }, { name = "PORT", value = "3000" }, { name = "NEXT_PUBLIC_APP_URL", value = "https://fitness.qworky.tech" }, { name = "NEXT_PUBLIC_SUPABASE_URL", value = var.public_supabase_url }, { name = "NEXT_PUBLIC_SUPABASE_ANON_KEY", value = var.public_supabase_anon_key }],
      portMappings     = [{ containerPort = 3000, hostPort = 0, protocol = "tcp" }],
      secrets          = [{ name = "SUPABASE_SERVICE_ROLE_KEY", valueFrom = var.service_role_parameter_arn }, { name = "OPEN_AI_API_KEY", valueFrom = var.openai_parameter_arn }],
      healthCheck      = { command = ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"], interval = 30, timeout = 5, retries = 3, startPeriod = 30 },
      logConfiguration = { logDriver = "awslogs", options = { awslogs-group = aws_cloudwatch_log_group.fitness.name, awslogs-region = "us-east-1", awslogs-stream-prefix = "web" } }
    }
    ], var.enable_tls ? [
    {
      name         = "tls", image = "${aws_ecr_repository.images["fitness-world-tls"].repository_url}@${var.tls_image_digest}", essential = true,
      cpu          = 32, memory = 128, memoryReservation = 32,
      portMappings = [{ containerPort = 443, hostPort = 443, protocol = "tcp" }],
      links        = ["web"],
      mountPoints  = [{ sourceVolume = "fitness-tls-data", containerPath = "/data", readOnly = false }],
      dependsOn    = [{ containerName = "web", condition = "HEALTHY" }],
      dockerLabels = {
        "traefik.enable"                                                  = "true",
        "traefik.http.routers.fitness-http.rule"                          = "Host(`fitness.qworky.tech`)",
        "traefik.http.routers.fitness-http.middlewares"                   = "fitness-https",
        "traefik.http.middlewares.fitness-https.redirectscheme.scheme"    = "https",
        "traefik.http.middlewares.fitness-https.redirectscheme.permanent" = "true",
        "traefik.http.services.fitness-http.loadbalancer.server.port"     = "443",
        "traefik.http.services.fitness-http.loadbalancer.server.scheme"   = "https"
      },
      logConfiguration = { logDriver = "awslogs", options = { awslogs-group = aws_cloudwatch_log_group.fitness.name, awslogs-region = "us-east-1", awslogs-stream-prefix = "tls" } }
    }
  ] : []))
}
resource "aws_ecs_service" "fitness" {
  name            = "fitness-production"
  cluster         = data.aws_ecs_cluster.world.id
  task_definition = aws_ecs_task_definition.fitness.arn
  desired_count   = 0
  launch_type     = "EC2"
  # Fixed host :443 cannot overlap on this single-node cluster.
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  placement_constraints {
    type       = "memberOf"
    expression = "ec2InstanceId == i-0ce9f5df9d48c2443"
  }
  lifecycle { ignore_changes = [desired_count] }
}
output "repositories" { value = { for k, r in aws_ecr_repository.images : k => r.repository_url } }
output "execution_role" { value = aws_iam_role.execution.arn }
