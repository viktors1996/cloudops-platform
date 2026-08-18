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

# 3. IAM Роль и Профиль для доступа через AWS Systems Manager (SSM)
resource "aws_iam_role" "ec2_ssm_role" {
  name = "cloudops-ec2-ssm-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Прикрепляем стандартную политику SSM
resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Создаем Instance Profile для передачи роли на EC2
resource "aws_iam_instance_profile" "ec2_ssm_profile" {
  name = "cloudops-ec2-ssm-profile-${var.environment}"
  role = aws_iam_role.ec2_ssm_role.name
}

# 4. Настраиваем Security Group (сетевой экран без 22 порта)
resource "aws_security_group" "api_sg" {
  name        = "cloudops-api-sg-${var.environment}"
  description = "Security group for CloudOps Platform API"

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

# 5. Создаем виртуальный сервер EC2
resource "aws_instance" "app_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.api_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_ssm_profile.name

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
    Name        = "cloudops-api-server-${var.environment}"
    Environment = var.environment
  }
}

# 6. Elastic IP для production-сервера
resource "aws_eip" "app_server" {
  domain = "vpc"

  tags = {
    Name        = "cloudops-production-eip"
    Environment = var.environment
  }
}

# Привязываем Elastic IP к EC2
resource "aws_eip_association" "app_server" {
  instance_id   = aws_instance.app_server.id
  allocation_id = aws_eip.app_server.id
}