# 1. Получаем свежий AMI образ Ubuntu 24.04 LTS
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# 2. Добавляем SSH-ключ в AWS
resource "aws_key_pair" "deployer" {
  key_name   = "cloudops-platform-key-${var.environment}"
  public_key = file(var.ssh_public_key_path)
}

# 3. Настраиваем Security Group (сетевой экран)
resource "aws_security_group" "api_sg" {
  name        = "cloudops-api-sg-${var.environment}"
  description = "Security group for CloudOps Platform API"

  # SSH доступ ТОЛЬКО с твоего IP
  ingress {
    description = "SSH access from developer IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["217.113.30.148/32"]
  }

  # HTTP доступ для всех
  ingress {
    description = "HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS доступ для всех
  ingress {
    description = "HTTPS traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Исходящий трафик (разрешено всё)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "cloudops-sg-${var.environment}"
    Environment = var.environment
  }
}

# 4. Создаем виртуальный сервер EC2
resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.api_sg.id]

  # Настройка основного диска (Root Volume)
  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # Автоматическая установка Docker и Docker Compose при старте сервера
  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y ca-certificates curl gnupg
              install -m 0755 -d /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
              chmod a+r /etc/apt/keyrings/docker.asc

              echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
                $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                tee /etc/apt/sources.list.d/docker.list > /dev/null

              apt-get update -y
              apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
              systemctl enable docker
              systemctl start docker
              usermod -aG docker ubuntu
              EOF

  tags = {
    Name        = "cloudops-server-${var.environment}"
    Environment = var.environment
  }
}