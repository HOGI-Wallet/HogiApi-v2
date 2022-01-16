provider "aws" {
  region = "us-east-1"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.21"
    }
  }
}

terraform {
  backend "s3" {
    bucket = "storagetfstate"
    key    = "terraform-state/terraform.tfstate"
    region = "us-east-1"
  }
}