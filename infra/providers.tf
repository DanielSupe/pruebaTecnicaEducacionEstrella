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

  # State lives locally and is not versioned. A remote backend would require
  # creating the bucket that hosts it first, outside this same Terraform.
}

provider "aws" {
  region = var.aws_region

  # Every resource stays identifiable in the bill without repeating tag blocks.
  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
    }
  }
}
