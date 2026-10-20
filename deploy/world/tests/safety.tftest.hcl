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
  service_role_parameter_arn = "arn:aws:ssm:us-east-1:240851517002:parameter/secrets/production/fitness/SUPABASE_SERVICE_ROLE_KEY"
  openai_parameter_arn       = "arn:aws:ssm:us-east-1:240851517002:parameter/secrets/production/fitness/OPEN_AI_API_KEY"
  secret_kms_key_arn         = "arn:aws:kms:us-east-1:240851517002:key/00000000-0000-0000-0000-000000000000"
}
run "retired_root_rejects_plan" {
  command = plan
  expect_failures = [var.fitness_legacy_root_retired]
}
