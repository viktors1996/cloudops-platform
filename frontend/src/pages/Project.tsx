import { motion } from 'framer-motion';
import { Activity, Boxes, Cloud, Code2, GitBranch, LockKeyhole, Monitor, ShieldCheck, Terminal, Workflow } from 'lucide-react';

const groups = [
  {
    title: 'Infrastructure',
    icon: Cloud,
    items: [
      ['AWS EC2', 'Production compute host for the platform'],
      ['Terraform', 'Infrastructure as Code for repeatable AWS provisioning'],
      ['IAM', 'Access control for deployment and AWS services'],
      ['OIDC', 'GitHub Actions assumes an AWS role without long-lived AWS keys'],
      ['AWS SSM', 'Remote deployment path without direct CI SSH access'],
    ],
  },
  {
    title: 'Containers & Networking',
    icon: Boxes,
    items: [
      ['Docker', 'Containerizes application and observability services'],
      ['Docker Compose', 'Defines the multi-service production stack'],
      ['Nginx', 'Reverse proxy for frontend, API and Grafana'],
      ['GHCR', 'Stores versioned API container images built by CI'],
    ],
  },
  {
    title: 'Application',
    icon: Code2,
    items: [
      ['FastAPI', 'REST backend and application metrics'],
      ['PostgreSQL', 'Persistent relational database'],
      ['Redis', 'In-memory cache/runtime dependency'],
      ['React + TypeScript', 'CloudOps operations frontend'],
      ['Vite + Tailwind', 'Frontend build toolchain and visual system'],
      ['Framer Motion', 'Focused UI motion and infrastructure animations'],
    ],
  },
  {
    title: 'CI/CD & Security',
    icon: Workflow,
    items: [
      ['GitHub Actions', 'Lint, test, security scan, build, push and deploy pipeline'],
      ['Ruff', 'Python linting and code-quality gate'],
      ['Pytest', 'Backend automated tests'],
      ['Trivy', 'Container vulnerability scanning'],
      ['AWS OIDC', 'Short-lived federated AWS credentials for deployment'],
    ],
  },
  {
    title: 'Observability',
    icon: Activity,
    items: [
      ['Prometheus', 'Metrics collection and query engine'],
      ['Grafana', 'Dashboards and alerting'],
      ['Loki', 'Centralized log store'],
      ['Promtail', 'Container log collector'],
      ['cAdvisor', 'Docker container resource metrics'],
      ['Node Exporter', 'EC2 host metrics'],
    ],
  },
];

export default function Project() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.07),transparent_40%)]" />
        <div className="relative max-w-4xl">
          <span className="text-[10px] font-mono tracking-[0.25em] text-blue-400">CLOUDOPS PLATFORM</span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-100 mt-3">Production-style DevOps portfolio platform</h1>
          <p className="text-slate-400 mt-4 leading-7">
            A hands-on platform built to demonstrate containerized application delivery, infrastructure automation,
            secure AWS deployment, CI/CD, observability and operational troubleshooting in one cohesive project.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-400" /> Delivery Architecture
        </h2>

        <div className="mt-5 grid md:grid-cols-7 gap-3 items-stretch">
          {[
            ['GitHub', 'Source'],
            ['Actions', 'CI'],
            ['Trivy', 'Security'],
            ['GHCR', 'Registry'],
            ['OIDC', 'AWS Auth'],
            ['SSM', 'Deploy'],
            ['EC2', 'Runtime'],
          ].map(([name, role], index) => (
            <motion.div key={name} whileHover={{ y: -3 }} className="relative rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-center">
              <p className="font-mono text-sm font-semibold text-slate-100">{name}</p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">{role}</p>
              {index < 6 && <span className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-600">→</span>}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <motion.div
              key={group.title}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-cyan-400" />
                <h2 className="font-mono text-sm font-semibold text-slate-200">{group.title}</h2>
              </div>

              <div className="mt-4 space-y-2">
                {group.items.map(([name, purpose]) => (
                  <div key={name} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-xs font-semibold text-slate-200">{name}</span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">USED</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-5">{purpose}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-mono font-semibold text-slate-200 mt-3">Security Decisions</h3>
          <p className="text-xs text-slate-500 leading-6 mt-2">
            AWS OIDC replaces long-lived GitHub AWS credentials, SSM performs remote deployment, secrets stay outside the repository,
            and Trivy scans the deployment image during CI.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <Monitor className="w-5 h-5 text-cyan-400" />
          <h3 className="font-mono font-semibold text-slate-200 mt-3">Observability</h3>
          <p className="text-xs text-slate-500 leading-6 mt-2">
            Prometheus metrics, Grafana dashboards and alerts, Loki centralized logs, cAdvisor container telemetry and Node Exporter host metrics
            provide visibility across the application and EC2 host.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <Terminal className="w-5 h-5 text-blue-400" />
          <h3 className="font-mono font-semibold text-slate-200 mt-3">Operational Focus</h3>
          <p className="text-xs text-slate-500 leading-6 mt-2">
            The project is designed as an operations learning environment: build failures, health checks, deployment issues,
            metrics, logs and infrastructure behavior are inspected and debugged directly.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
        <div className="flex items-start gap-3">
          <LockKeyhole className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h2 className="font-mono font-semibold text-slate-100">AI-assisted development</h2>
            <p className="text-sm text-slate-400 mt-2 leading-7 max-w-5xl">
              This project was implemented as a hands-on DevOps learning and portfolio project. ChatGPT was used as a technical mentor
              and pair-programming assistant for architecture discussions, troubleshooting, code review, documentation and learning unfamiliar
              concepts. Infrastructure configuration, execution, testing, debugging and validation were performed by the project author.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}