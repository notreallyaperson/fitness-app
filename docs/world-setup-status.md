# World fitness setup status — 2026-10-20

This supersedes preparation-only status in world-migration.md. Source applications remain running and unchanged. No runtime secret value has been read, copied or configured for the new destination.

## Completed under setup approval

Live now uses selected deployment branches, with exactly one Branch rule `main`; no tags/wildcards. Read-only verifier passes. GitHub environment policy id69392430, branch rule id63645867. Publisher trust was created only after verifying this restriction.

The saved live bootstrap plan was inspected and asserted to contain only the approved subset. Terraform apply completed: **8 added,0changed,0destroyed**:

- ECR fitness-world-web and fitness-world-tls (immutable, AES256, scanning enabled; both verified empty).
- CloudWatch log group /ecs-world/fitness-production,14-day retention.
- IAM roles fitness-world-execution, fitness-world-task, fitness-world-image-publisher.
- Exact scoped inline policies on execution and publisher roles. Task role has no inline or attached policies; no role has attached managed policies.

Read back actual policy scopes: image access only the two repositories; logs only fitness group; SSM only the two named future parameter ARNs; KMS only existing key5d94b946-ce37-4132-b55a-914edb171fd6 via ssm.us-east-1.amazonaws.com. Publisher trust is exact Live subject/STS audience and grants ECR uploads only, plus wildcard ECR authentication.

Isolated state exists at s3://premierfleets-terraform/fitness-world/terraform.tfstate, verified AES256 encrypted. No other state key was changed. Runtime parameter metadata query returned no names. No images, task definition, ECS service, tasks or TLS volume were created. No new EC2, load balancer, DNS/security-group change, source stop, Babloop change or PR merge occurred.

## Exact remaining blocker

Two of the ten resources are **not created**: fitness-production task definition and world/fitness-production service. Native ARM validation built images ephemerally and did not publish them. Both new repositories are empty; a real ARM image digest is required before registering an honest task definition. The publisher workflow is still an inactive review example in draftPR1, and Live now correctly rejects branch refs other thanmain. The current approval explicitly excludes merge, so no main publishing path was activated. No placeholder image was registered.

Next required approval: activate the reviewed publisher workflow and merge the preparation PR to main, then publish immutable ARM candidates using the already scoped publisher role. This does not itself authorize starting a task. Once real digests/public build configuration exist, review the remaining two-resource plan with service desired0 and TLSfalse before applying. Private runtime values are not required to publish images or register a stopped service, but must be entered by the user before any later task start.

## Secure user handoff — values never in chat

In the existing AWS console account240851517002, choose US East (N.Virginia), us-east-1. Open Systems Manager → Parameter Store → Create parameter, once for each name:

1. /secrets/production/fitness/SUPABASE_SERVICE_ROLE_KEY
2. /secrets/production/fitness/OPEN_AI_API_KEY

For each: Standard tier, SecureString type, text data, existing KMS key alias/aws/ssm. Enter the corresponding **existing fitness runtime value** directly from the approved credential store. Do not create new credentials, paste values into chat/Git/CLI arguments, use Advanced tier, or create a KMS key. Confirm only that the names are saved. Agent verification should use DescribeParameters metadata, never GetParameter with decryption. User must also confirm the existing Supabase database backup/recovery path and unchanged fitness auth callback before cutover.

## Cost and health

No compute is added and no tasks/images/log ingestion exist at setup completion. Current incremental usage is small state storage/requests; no new fixed-cost service is proposed. The previously disclosed model remains approximately$0.62/month at1GB images+1GB/month logs, excluding network/KMS/taxes;10GB logs approaches$5.24 and would exceed the approved$5 projection. No hard billing cap or budget alarm was created. Pause before projected usage exceeds$5/month.

Final public fitness health and tax HTTPS checks both200. The original ARM run39348669762 remains successful; no unrelated validation rerun or additional workflow started during setup.
