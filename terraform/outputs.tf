output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "ssh_connection_command" {
  description = "Command to SSH into the instance"
  value       = "ssh ubuntu@${aws_instance.app_server.public_ip}"
}