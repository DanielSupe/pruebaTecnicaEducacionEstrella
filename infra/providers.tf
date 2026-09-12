terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }

  # El estado vive en local y no se versiona. Es una limitacion consciente para un
  # unico desarrollador: un backend remoto exigiria crear antes el bucket que lo
  # aloja, fuera de este mismo Terraform. Ver design.md del change setup-infra-base.
}

provider "aws" {
  region = var.aws_region

  # Todo recurso queda identificable en la factura y en la consola sin repetir
  # bloques de tags en cada resource.
  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
    }
  }
}
