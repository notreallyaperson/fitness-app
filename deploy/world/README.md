# Retired Terraform deployment root

Fitness's ten existing AWS resource bindings were transferred to the shared `premierfleets-devops` deployment state after PR70 merged. This root no longer owns managed resources. Do not plan/apply here or override `fitness_legacy_root_retired`: doing so could propose duplicate resources against the empty historical state.

Use `/home/avinash/Mindset/PremierFleets/premierfleets-devops/deployment/project`. Shared state key: `premierfleets-terraform/terraform.tfstate`; fitness prefix: `module.fitness[0].`. The old key `fitness-world/terraform.tfstate` is retained for history/data references only. Do not import or move bindings back without a reviewed rollback across both roots.

The tracked variable-validation guard blocks default plan/apply. The backend and old resource definitions remain for historical comparison; they are not an active deployment path. Dockerfile.tls, Caddyfile and image-publishing workflows remain in use and are unchanged. The infrastructure safety test now verifies rejection of this retired root using mocks.

No service start, parameter provisioning, DNS change or resource apply is part of this correction. The live app remains on its old host until a separate cutover.
