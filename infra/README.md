# Infraestructura

Terraform para AWS (`us-east-1`, dentro del Free Tier).

- La base (DynamoDB, S3 de videos y Cognito) llega en el change `setup-infra-base`.
- Lambda, API Gateway y CloudFront llegan en el change `setup-deployment`.

El estado (`*.tfstate`) y las variables reales (`*.tfvars`) no se versionan: ver `.gitignore`.
