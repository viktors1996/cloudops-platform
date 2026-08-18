output "public_ip" {
  description = "Elastic IP address of the CloudOps production server"
  value       = aws_eip.app_server.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app_server.id
}

output "ssm_connection_command" {
  description = "Command to connect to EC2 through AWS Systems Manager"
  value       = "aws ssm start-session --target ${aws_instance.app_server.id} --profile cloudops --region eu-central-1"
}
