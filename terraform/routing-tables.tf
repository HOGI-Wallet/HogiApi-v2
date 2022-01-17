resource "aws_route_table" "publicrt" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id

  }
  tags = {
    "Name" = "Public Route table"
  }
}
resource "aws_route_table" "privatert1" {
  vpc_id = aws_vpc.main.id

  route {
    # The CIDR block of the route.
    cidr_block = "0.0.0.0/0"

    # Identifier of a VPC NAT gateway.
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = {
    Name = "private route table 1"
  }
}

resource "aws_route_table" "privatert2" {
  vpc_id = aws_vpc.main.id

  route {
    # The CIDR block of the route.
    cidr_block = "0.0.0.0/0"

    # Identifier of a VPC NAT gateway.
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "private route table 2"
  }
}

resource "aws_route_table_association" "publictable1" {
  subnet_id      = aws_subnet.public_sn1.id
  route_table_id = aws_route_table.publicrt.id
}


resource "aws_route_table_association" "publictable2" {

  subnet_id      = aws_subnet.public_sn2.id
  route_table_id = aws_route_table.publicrt.id
}

resource "aws_route_table_association" "privatetabele1" {
  subnet_id      = aws_subnet.private_sn1.id
  route_table_id = aws_route_table.privatert1.id
}

resource "aws_route_table_association" "privatetable2" {
  subnet_id      = aws_subnet.private_sn2.id
  route_table_id = aws_route_table.privatert2.id
}