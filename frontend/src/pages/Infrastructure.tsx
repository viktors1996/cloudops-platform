import { motion } from 'framer-motion';
import { Activity, Box, Globe, HardDrive, Network, Server } from 'lucide-react';

type Tone = 'blue' | 'emerald' | 'indigo' | 'amber' | 'cyan' | 'slate';

type Service = {
  name: string;
  role: string;
  port?: string;
  detail: string;
  tone: Tone;
};

const services: Service[] = [
  { name: 'Nginx', role: 'Edge / Reverse Proxy', port: ':80', detail: 'Routes frontend, API and Grafana traffic', tone: 'emerald' },
  { name: 'Frontend', role: 'React + Vite', detail: 'Static CloudOps UI served by Nginx', tone: 'blue' },
  { name: 'FastAPI', role: 'Backend API', port: ':8000', detail: 'Application API and Prometheus metrics endpoint', tone: 'blue' },
  { name: 'PostgreSQL', role: 'Primary Database', port: ':5432', detail: 'Persistent relational application data', tone: 'indigo' },
  { name: 'Redis', role: 'Cache / Runtime Service', port: ':6379', detail: 'In-memory cache and runtime dependency', tone: 'amber' },
  { name: 'Prometheus', role: 'Metrics Store', port: ':9090', detail: 'Scrapes application, container and host metrics', tone: 'cyan' },
  { name: 'Grafana', role: 'Visualization / Alerting', port: ':3000', detail: 'Dashboards, queries and alert rules', tone: 'amber' },
  { name: 'Loki', role: 'Log Store', port: ':3100', detail: 'Centralized application and container logs', tone: 'cyan' },
  { name: 'Promtail', role: 'Log Collector', detail: 'Collects Docker logs and ships them to Loki', tone: 'slate' },
  { name: 'cAdvisor', role: 'Container Metrics', port: ':8080', detail: 'Docker CPU, memory and network telemetry', tone: 'emerald' },
  { name: 'Node Exporter', role: 'Host Metrics', port: ':9100', detail: 'EC2 CPU, RAM, disk and OS metrics', tone: 'emerald' },
];

const toneClass: Record<Tone, string> = {
  blue: 'border-blue-500/25 text-blue-300 bg-blue-500/5',
  emerald: 'border-emerald-500/25 text-emerald-300 bg-emerald-500/5',
  indigo: 'border-indigo-500/25 text-indigo-300 bg-indigo-500/5',
  amber: 'border-amber-500/25 text-amber-300 bg-amber-500/5',
  cyan: 'border-cyan-500/25 text-cyan-300 bg-cyan-500/5',
  slate: 'border-slate-700 text-slate-300 bg-slate-900/70',
};

function Connector({ delay = 0 }: { delay?: number }) {
  return (
    <div className="relative hidden lg:flex items-center justify-center w-20 h-8 overflow-hidden">
      <div className="absolute inset-x-0 h-px bg-slate-700" />
      <motion.span
        className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
        animate={{ x: [-34, 34] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay }}
      />
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`rounded-2xl border p-4 shadow-xl transition-all ${toneClass[service.tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4" />
            <h3 className="font-mono font-semibold text-sm text-slate-100">{service.name}</h3>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest mt-1 opacity-80">{service.role}</p>
        </div>
        <span className="text-[10px] font-mono text-emerald-400">● SERVICE</span>
      </div>
      <p className="text-xs text-slate-400 mt-3">{service.detail}</p>
      {service.port && <p className="text-[10px] font-mono text-slate-500 mt-2">internal {service.port}</p>}
    </motion.div>
  );
}


type TopologyNode = {
  service: Service;
  x: number;
  y: number;
  w: number;
};

const topologyNodes: TopologyNode[] = [
  { service: services[0], x: 50, y: 4,  w: 18 },  // Nginx

  { service: services[1], x: 15, y: 27, w: 18 },  // Frontend
  { service: services[2], x: 50, y: 27, w: 18 },  // FastAPI
  { service: services[6], x: 85, y: 27, w: 18 },  // Grafana

  { service: services[3], x: 28, y: 51, w: 18 },  // PostgreSQL
  { service: services[4], x: 50, y: 51, w: 18 },  // Redis
  { service: services[5], x: 72, y: 51, w: 18 },  // Prometheus
  { service: services[7], x: 88, y: 51, w: 14 },  // Loki

  { service: services[9], x: 60, y: 76, w: 16 },  // cAdvisor
  { service: services[10], x: 78, y: 76, w: 16 }, // Node Exporter
  { service: services[8], x: 91, y: 76, w: 11 },  // Promtail
];

const flows = [
  // Edge routing: Nginx fans out to frontend, API and Grafana.
  { d: 'M 600 105 V 145 H 180 V 178', color: '#22d3ee', delay: '0s' },
  { d: 'M 600 105 V 178', color: '#3b82f6', delay: '0.25s' },
  { d: 'M 600 105 V 145 H 1020 V 178', color: '#22d3ee', delay: '0.5s' },

  // Application dependencies: FastAPI talks to PostgreSQL and Redis.
  { d: 'M 600 248 V 300 H 336 V 337', color: '#818cf8', delay: '0.15s' },
  { d: 'M 600 248 V 337', color: '#f59e0b', delay: '0.45s' },

  // FastAPI metrics are scraped by Prometheus.
  { d: 'M 600 248 V 285 H 864 V 337', color: '#22d3ee', delay: '0.7s' },

  // Host/container exporters feed Prometheus.
  { d: 'M 720 502 V 475 H 864 V 455', color: '#22d3ee', delay: '0.2s' },
  { d: 'M 936 502 V 475 H 864 V 455', color: '#22d3ee', delay: '0.6s' },

  // Prometheus is queried by Grafana.
  { d: 'M 864 337 V 300 H 1020 V 248', color: '#f59e0b', delay: '0.1s' },

  // Docker logs are collected by Promtail, stored in Loki and viewed in Grafana.
  { d: 'M 1092 502 V 455 H 1056', color: '#38bdf8', delay: '0.35s' },
  { d: 'M 1056 337 V 300 H 1020 V 248', color: '#38bdf8', delay: '0.8s' },
];

function TopologyServiceCard({ node }: { node: TopologyNode }) {
  const service = node.service;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.18 }}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        width: `${node.w}%`,
      }}
      className={`absolute z-10 -translate-x-1/2 rounded-xl border p-3 shadow-2xl backdrop-blur-sm ${toneClass[service.tone]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span className="font-mono text-[11px] font-semibold text-slate-100 truncate">
              {service.name}
            </span>
          </div>
          <p className="text-[8px] font-mono uppercase tracking-widest mt-1 opacity-80 truncate">
            {service.role}
          </p>
        </div>

        <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          UP
        </span>
      </div>

      {service.port && (
        <div className="mt-2 text-[8px] font-mono text-slate-500">
          {service.port}
        </div>
      )}
    </motion.div>
  );
}

function ComposeTopology() {
  return (
    <div className="relative mt-5">
      <div className="hidden lg:block relative h-[660px] rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.07),transparent_48%)]" />

        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5">
          <Network className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[9px] font-mono text-blue-300">cloudops_default network</span>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.85)] animate-pulse" />
          <span className="text-[9px] font-mono text-slate-500">animated service traffic</span>
        </div>

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 660"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="wireGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {flows.map((flow, index) => (
            <g key={index}>
              <path
                d={flow.d}
                fill="none"
                stroke="#334155"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle r="4.5" fill={flow.color} filter="url(#wireGlow)">
                <animateMotion
                  dur={`${2.3 + (index % 4) * 0.35}s`}
                  begin={flow.delay}
                  repeatCount="indefinite"
                  path={flow.d}
                />
              </circle>
            </g>
          ))}
        </svg>

        {topologyNodes.map((node) => (
          <TopologyServiceCard key={node.service.name} node={node} />
        ))}

        <div className="absolute bottom-4 left-4 right-4 z-20 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
            <p className="text-[8px] font-mono uppercase tracking-widest text-slate-600">Application</p>
            <p className="text-[9px] font-mono text-slate-300 mt-1">Nginx → FastAPI → PostgreSQL / Redis</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
            <p className="text-[8px] font-mono uppercase tracking-widest text-slate-600">Metrics</p>
            <p className="text-[9px] font-mono text-slate-300 mt-1">API / cAdvisor / Node Exporter → Prometheus → Grafana</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
            <p className="text-[8px] font-mono uppercase tracking-widest text-slate-600">Logs</p>
            <p className="text-[9px] font-mono text-slate-300 mt-1">Docker Logs → Promtail → Loki → Grafana</p>
          </div>
        </div>
      </div>

      <div className="lg:hidden grid sm:grid-cols-2 gap-3">
        {services.map((service) => (
          <ServiceCard key={service.name} service={service} />
        ))}
      </div>
    </div>
  );
}

export default function Infrastructure() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.09),transparent_35%)]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Box className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Docker Compose Infrastructure</h1>
              <p className="text-xs font-mono text-slate-400 mt-1">Production container architecture on AWS EC2</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">AWS EC2</span>
            <span className="px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] font-mono">Docker Compose</span>
            <span className="px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">{services.length} services</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" /> Application Request Path
            </h2>
            <p className="text-[10px] font-mono text-slate-500 mt-1">How external traffic reaches application services</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-3 items-center">
          <ServiceCard service={services[0]} />
          <Connector />
          <ServiceCard service={services[2]} />
          <Connector delay={0.35} />
          <div className="grid sm:grid-cols-2 gap-3">
            <ServiceCard service={services[3]} />
            <ServiceCard service={services[4]} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Globe className="w-4 h-4 text-blue-400" />
            Internet → Nginx → FastAPI → PostgreSQL / Redis
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Metrics Flow
          </h2>
          <div className="mt-5 space-y-3">
            {[
              'FastAPI /metrics → Prometheus',
              'cAdvisor → Prometheus',
              'Node Exporter → Prometheus',
              'Prometheus → Grafana',
            ].map((flow) => (
              <div key={flow} className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs font-mono text-slate-300">
                {flow}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" /> Log Flow
          </h2>
          <div className="mt-5 space-y-3">
            {[
              'Docker container logs → Promtail',
              'Promtail → Loki',
              'Loki → Grafana Explore',
              'Grafana → dashboards / alerting',
            ].map((flow) => (
              <div key={flow} className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs font-mono text-slate-300">
                {flow}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" /> Compose Service Network
            </h2>
            <p className="text-[10px] font-mono text-slate-500 mt-1">
              Visual map of real CloudOps containers and how traffic, metrics and logs move between them
            </p>
          </div>

          <div className="flex items-center gap-2 text-[9px] font-mono text-slate-600">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.8)]" />
            live flow animation
          </div>
        </div>

        <ComposeTopology />
      </section>
    </div>
  );
}