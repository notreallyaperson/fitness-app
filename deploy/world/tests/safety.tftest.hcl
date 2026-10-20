mock_provider "aws" {
  override_during = plan
  mock_resource "aws_ecr_repository" {
    defaults = {
      repository_url = "240851517002.dkr.ecr.us-east-1.amazonaws.com/fixture"
      arn            = "arn:aws:ecr:us-east-1:240851517002:repository/fixture"
    }
  }
  mock_resource "aws_iam_role" {
    defaults = { arn = "arn:aws:iam::240851517002:role/fixture" }
  }
  mock_data "aws_ecs_cluster" {
    defaults = { id = "arn:aws:ecs:us-east-1:240851517002:cluster/world", arn = "arn:aws:ecs:us-east-1:240851517002:cluster/world" }
  }
  mock_data "aws_iam_openid_connect_provider" {
    defaults = { arn = "arn:aws:iam::240851517002:oidc-provider/token.actions.githubusercontent.com" }
  }
}
variables {
  web_image_digest           = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  tls_image_digest           = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  public_supabase_url        = "https://synthetic.invalid"
  public_supabase_anon_key   = "synthetic"
  service_role_parameter_arn = "arn:aws:ssm:us-east-1:240851517002:parameter/secrets/production/fitness/SUPABASE_SERVICE_ROLE_KEY"
  openai_parameter_arn       = "arn:aws:ssm:us-east-1:240851517002:parameter/secrets/production/fitness/OPEN_AI_API_KEY"
  secret_kms_key_arn         = "arn:aws:kms:us-east-1:240851517002:key/00000000-0000-0000-0000-000000000000"
}
run "inactive_candidate" {
  command = plan
  assert {
    condition = jsondecode(aws_iam_role.publisher.assume_role_policy).Statement[0].Condition.StringEquals["token.actions.githubusercontent.com:sub"] == "repo:notreallyaperson/fitness-app:environment:Live" && jsondecode(aws_iam_role.publisher.assume_role_policy).Statement[0].Condition.StringEquals["token.actions.githubusercontent.com:aud"] == "sts.amazonaws.com"
    error_message = "Publisher IAM must retain exact repository/environment subject and STS audience; ref restriction is enforced by separately approved Live main-only rules."
  }
  assert {
    condition     = aws_ecs_service.fitness.desired_count == 0 && aws_ecs_task_definition.fitness.network_mode == "bridge" && length(jsondecode(aws_ecs_task_definition.fitness.container_definitions)) == 1
    error_message = "Preparation must not start tasks, enable premature ACME, or use host networking."
  }
  assert {
    condition     = aws_ecs_task_definition.fitness.cpu == "256" && aws_ecs_task_definition.fitness.memory == "768"
    error_message = "Fitness must retain a bounded task CPU/memory budget."
  }
}
run "approved_tls_revision" {
  command = plan
  variables { enable_tls = true }
  assert {
    condition     = length(jsondecode(aws_ecs_task_definition.fitness.container_definitions)) == 2 && jsondecode(aws_ecs_task_definition.fitness.container_definitions)[1].links[0] == "web" && aws_ecs_service.fitness.desired_count == 0
    error_message = "TLS must connect through the bridge link without implicitly starting service."
  }
}
