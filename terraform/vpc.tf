resource "aws_vpc" "main" {
  
  cidr_block = "192.168.0.0/16"  # cider block for vpc
  
  instance_tenancy = "default" # Make your instance share host
  
  enable_dns_support = true
  
  enable_dns_hostnames = true
  
  enable_classiclink = false # Enable/disable ClassicLink for the VPC.

  enable_classiclink_dns_support = false # Enable/disable ClassicLink DNS Support for the VPC.

  assign_generated_ipv6_cidr_block = false  # Requests an Amazon-provided IPv6 CIDR block with a /56 prefix length for the VPC.

  # A map of tags to assign to the resource.
  tags = {
    Name = "main"
  }

}

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC id."
  # Setting an output value as sensitive prevents Terraform from showing its value in plan and apply.
  sensitive = false
}

