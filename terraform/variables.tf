variable "aws_region" {
  description = "AWS Region for deployment"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name (dev, stage, prod)"
  type        = string
  default     = "dev"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key_path" {
  description = "Path to the public SSH key for EC2 access"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}