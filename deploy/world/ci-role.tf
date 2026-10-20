# PREREQUISITE: Live must allow only branch main (not tags/wildcards).
# Environment OIDC sub omits ref; do not provision this role before that setting is verified.
# New persistent access: review/approve before apply. Existing account OIDC provider only.
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}
resource "aws_iam_role" "publisher" {
  name = "fitness-world-image-publisher"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect    = "Allow", Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }, Action = "sts:AssumeRoleWithWebIdentity",
    Condition = { StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com", "token.actions.githubusercontent.com:sub" = "repo:notreallyaperson/fitness-app:environment:Live" } }
  }] })
}
resource "aws_iam_role_policy" "publisher" {
  role = aws_iam_role.publisher.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage"], Resource = [for r in aws_ecr_repository.images : r.arn] }
  ] })
}
output "publisher_role" { value = aws_iam_role.publisher.arn }
