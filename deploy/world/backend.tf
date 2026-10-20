# Existing devops bucket, new fitness-only state key. No backend initialized here.
terraform {
  backend "s3" {
    bucket       = "premierfleets-terraform"
    key          = "fitness-world/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
