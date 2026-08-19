CloudOps Platform







CloudOps Platform is a production-like DevOps portfolio project that demonstrates how a containerized web application can be built, secured, monitored, and automatically deployed to AWS.

The platform combines a React frontend, FastAPI backend, PostgreSQL, Redis, Nginx, observability tooling, Infrastructure as Code, security scanning, and an automated GitHub Actions delivery pipeline.

Live production: https://viktor-devops.online
API health: https://viktor-devops.online/api/v1/health
Grafana: https://viktor-devops.online/grafana/ (authentication required)

This is a single-node portfolio deployment designed to demonstrate DevOps practices. It is not presented as a highly available or enterprise production architecture.

Overview

The project was built to practice and demonstrate an end-to-end DevOps workflow:

infrastructure provisioning with Terraform;

AWS EC2 administration through Systems Manager;

Docker-based application delivery;

CI/CD with GitHub Actions;

vulnerability scanning with Trivy;

image publishing to GitHub Container Registry;

deployment without public SSH access;

metrics, logs, dashboards, and alerting;

HTTPS with a real domain and Let's Encrypt;

production-style reverse proxying with Nginx.

The frontend also acts as an operations portal where application tasks can be created, updated, completed, reopened, and deleted through the live API.

Architecture

flowchart TD
    U[User / Browser] -->|HTTPS| DNS[viktor-devops.online]
    DNS --> EIP[Elastic IP]
    EIP --> EC2[AWS EC2]

    EC2 --> NGINX[Nginx Reverse Proxy]

    NGINX --> FE[React + TypeScript Frontend]
    NGINX --> API[FastAPI Backend]
    NGINX --> GRAFANA[Grafana]

    API --> PG[(PostgreSQL)]
    API --> REDIS[(Redis)]

    API --> PROM[Prometheus]
    CAD[cAdvisor] --> PROM
    NODE[Node Exporter] --> PROM

    PROM --> GRAFANA

    DOCKER[Docker Container Logs] --> PROMTAIL[Promtail]
    PROMTAIL --> LOKI[Loki]
    LOKI --> GRAFANA

Request flow

Internet
   |
   v
viktor-devops.online
   |
   v
Elastic IP
   |
   v
AWS EC2
   |
   v
Nginx :80 / :443
   |
   +--> /              -> React frontend
   +--> /api/*         -> FastAPI
   +--> /docs          -> FastAPI Swagger UI
   +--> /grafana/*     -> Grafana

HTTP traffic is redirected to HTTPS.

Technology Stack

Area

Technologies

Cloud

AWS EC2, IAM, Systems Manager

Infrastructure as Code

Terraform

Containers

Docker, Docker Compose

Reverse proxy / TLS edge

Nginx, Let's Encrypt

Backend

Python 3.12, FastAPI, SQLAlchemy, asyncpg

Frontend

React, TypeScript, Vite, Tailwind CSS, Framer Motion

Database

PostgreSQL 16

Cache

Redis 7

CI/CD

GitHub Actions

Container Registry

GitHub Container Registry (GHCR)

Security

Trivy, non-root API container, HTTPS, AWS OIDC

Metrics

Prometheus, Node Exporter, cAdvisor

Logging

Loki, Promtail

Dashboards / Alerting

Grafana

Testing / Linting

Pytest, Ruff

CI/CD Pipeline

Every push to main runs the delivery pipeline.

flowchart LR
    A[Git Push] --> B[Lint + Tests]
    B --> C[Trivy Security Scan]
    C --> D[Build API Image]
    C --> E[Build Frontend Image]
    D --> F[GHCR]
    E --> F
    F --> G[AWS OIDC]
    G --> H[SSM Deploy]
    H --> I[EC2]
    I --> J[docker compose pull]
    J --> K[docker compose up]
    K --> L[API Health Check]

Pipeline stages

Lint & Test

Python 3.12

Ruff

Pytest

Security Scan

builds a test API image;

scans OS and library vulnerabilities with Trivy;

blocks the pipeline on HIGH or CRITICAL findings.

Build & Push

builds API and frontend Docker images;

publishes latest and SHA-based tags to GHCR.

Deploy

GitHub authenticates to AWS using OIDC;

no long-lived AWS access keys are stored in GitHub;

deployment is executed on EC2 through AWS Systems Manager;

the server pulls new images and recreates the stack;

the workflow verifies API readiness after deployment.

Infrastructure as Code

Terraform manages the core AWS infrastructure.

Managed resources include:

EC2 instance;

Security Group;

IAM role for SSM;

IAM instance profile;

SSM managed policy attachment;

EC2 key pair;

Elastic IP;

Elastic IP association.

The current Terraform state is synchronized with the deployed infrastructure and terraform plan returns no drift after the latest apply.

Network exposure

The Security Group intentionally exposes only:

80/tcp   HTTP
443/tcp  HTTPS

SSH port 22 is not exposed publicly.

Server administration is performed through AWS Systems Manager Session Manager:

aws ssm start-session \
  --target <INSTANCE_ID> \
  --profile cloudops \
  --region eu-central-1

Security Decisions

Several security controls are intentionally included in the project:

HTTPS with a real domain and Let's Encrypt;

HTTP -> HTTPS redirect;

AWS OIDC for GitHub Actions instead of stored AWS access keys;

AWS SSM for server administration instead of public SSH;

Trivy as a blocking CI security gate;

API container runs as a non-root user;

.env files and Terraform state are excluded from Git;

PostgreSQL, Redis, Prometheus, Loki, Grafana, cAdvisor, and Node Exporter are not directly published to the internet;

external traffic is routed through Nginx;

production debug mode is disabled.

A real pipeline failure caused by HIGH vulnerabilities in Debian packages was fixed by updating the image packages rather than bypassing the Trivy gate.

Observability

The monitoring stack runs alongside the application in Docker Compose.

Metrics

Prometheus scrapes:

FastAPI metrics;

Prometheus itself;

Node Exporter;

cAdvisor.

Logs

Docker containers
      |
      v
   Promtail
      |
      v
     Loki
      |
      v
   Grafana

Grafana

Grafana provides dashboards for:

EC2 CPU usage;

EC2 memory usage;

disk usage;

uptime;

container resource usage;

API request rate;

API latency;

application and infrastructure logs.

Grafana alerting is also configured to send notifications through Telegram.

CloudOps Operations Portal

The React frontend contains three main sections:

Overview

live API status;

real browser-to-API latency;

task success rate;

operations task management;

production service topology;

infrastructure health;

live event stream;

API performance history.

Infrastructure

Visualizes the deployed service relationships, including application, metrics, and logging flows.

Project

Documents the delivery pipeline, AWS deployment model, observability stack, and technologies used by the platform.

Task API

The backend exposes CRUD operations for tasks.

Method

Endpoint

Purpose

GET

/api/v1/tasks/

List tasks

POST

/api/v1/tasks/

Create task

GET

/api/v1/tasks/{id}

Get one task

PUT

/api/v1/tasks/{id}

Update task

DELETE

/api/v1/tasks/{id}

Delete task

GET

/api/v1/health

API health check

Example:

curl https://viktor-devops.online/api/v1/health

Expected response:

{
  "status": "healthy",
  "service": "backend-api"
}

Project Structure

cloudops-platform/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── main.py
│   │   └── models.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── pyproject.toml
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── api.ts
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
│
├── monitoring/
│   ├── prometheus.yml
│   ├── loki-config.yml
│   └── promtail-config.yml
│
├── nginx/
│   └── default.conf
│
├── terraform/
│   ├── main.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── variables.tf
│   └── .terraform.lock.hcl
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker-compose.yml
└── .gitignore

Running Locally

Requirements

Docker

Docker Compose

Git

Clone the repository:

git clone https://github.com/viktors1996/cloudops-platform.git
cd cloudops-platform

Create the environment file from the provided example and define the required secrets.

At minimum the Compose stack expects values such as:

POSTGRES_PASSWORD=change-me
GRAFANA_ADMIN_PASSWORD=change-me
GRAFANA_ROOT_URL=http://localhost/grafana/

Then start the stack:

docker compose up -d

Check container status:

docker compose ps

Check API health:

curl http://localhost/api/v1/health

Production certificates, .env, Terraform state, and local backups are intentionally not stored in the repository.

Production Deployment

The production deployment does not require manually building application images on the EC2 host.

GitHub Actions
    |
    +--> build API image ------+
    |                          |
    +--> build frontend image -+--> GHCR
                                   |
                                   v
                              AWS OIDC
                                   |
                                   v
                              AWS SSM
                                   |
                                   v
                                  EC2
                                   |
                                   v
                          docker compose pull
                                   |
                                   v
                          docker compose up -d

This keeps image building inside CI and leaves the server responsible primarily for pulling and running versioned application artifacts.

Engineering Decisions

Why AWS SSM instead of SSH?

The instance does not expose port 22 to the public internet. SSM provides authenticated administrative access through AWS IAM.

Why OIDC instead of AWS access keys in GitHub?

OIDC allows GitHub Actions to request short-lived AWS credentials, removing the need to keep permanent AWS keys in repository secrets.

Why GHCR for both application images?

Both frontend and backend artifacts are built in CI and delivered consistently to the server. The EC2 host does not need to compile frontend assets during deployment.

Why Prometheus + Loki + Grafana?

The combination provides both sides of observability:

Prometheus for metrics;

Loki for centralized logs;

Grafana for visualization and alerting.

Why Docker Compose instead of Kubernetes?

The goal of this project is to demonstrate a production-like single-server DevOps stack. Docker Compose keeps the deployment understandable and appropriate for one EC2 instance. Kubernetes would add operational complexity without providing meaningful high availability on a single node.

Current Limitations

The project intentionally has several limitations that would be addressed in a larger production environment:

single EC2 instance;

no multi-AZ/high-availability architecture;

PostgreSQL runs in Docker instead of a managed database service;

Redis runs locally instead of a managed cache;

TLS certificate lifecycle is currently managed directly on the server;

observability services share the same EC2 host as the application;

no Kubernetes orchestration.

These trade-offs keep the project cost-effective while still demonstrating the core DevOps workflow.

Possible Next Steps

Potential future improvements:

AWS Route 53 managed through Terraform;

managed database with Amazon RDS;

managed Redis with ElastiCache;

remote Terraform state in S3 with state locking;

separate monitoring host;

read-only public Grafana demo access;

Kubernetes / Helm deployment variant;

multi-environment infrastructure (dev, staging, prod).

AI Assistance

ChatGPT was used as a technical mentor and pair-programming assistant during development.

Infrastructure configuration, command execution, testing, debugging, validation, and deployment were performed by the project author. The project is intended to demonstrate practical understanding of the technologies and the ability to explain the engineering decisions behind them.

Repository

GitHub: https://github.com/viktors1996/cloudops-platform

Author

Viktor Sogoyan
Junior DevOps Engineer