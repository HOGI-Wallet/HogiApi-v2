resource "aws_subnet" "public_sn1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "192.168.0.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  # A map of tags to assign to the resource.
  tags = {
    Name                               = "public-us-east-1a"
    "kubernetes.io/cluster/Cryptokara" = "shared"
    "kubernetes.io/role/internal-elb"  = 1
  }
}

resource "aws_subnet" "public_sn2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "192.168.64.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  # A map of tags to assign to the resource.
  tags = {
    Name                               = "public-us-east-1b"
    "kubernetes.io/cluster/Cryptokara" = "shared"
    "kubernetes.io/role/elb"           = 1
  }
}

resource "aws_subnet" "private_sn1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "192.168.128.0/24"
  availability_zone = "us-east-1c"
  # A map of tags to assign to the resource.
  tags = {
    Name                               = "private-us-east-1c"
    "kubernetes.io/cluster/Cryptokara" = "shared"
    "kubernetes.io/role/internal-elb"  = 1
  }
}

resource "aws_subnet" "private_sn2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "192.168.192.0/24"
  availability_zone = "us-east-1d"

  # A map of tags to assign to the resource.
  tags = {
    Name                               = "private-us-east-1d"
    "kubernetes.io/cluster/Cryptokara" = "shared"
    "kubernetes.io/role/internal-elb"  = 1
  }
}





output "private_subnets_id1" {
  description = "private subnet1"
  value       = aws_subnet.private_sn1.id
}

output "private_subnets_id2" {
  description = "private subnet 2"
  value       = aws_subnet.private_sn2.id
}

output "public_subnets_id1" {
  description = "public subnet  1"
  value       = aws_subnet.public_sn1.id
}

output "public_subnets_id2" {
  description = "public subnet 2"
  value       = aws_subnet.public_sn2.id
}