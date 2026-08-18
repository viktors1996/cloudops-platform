import React, { useState, useEffect, useRef } from 'react';
import { api, type Task } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Activity,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  Terminal,
  Database,
  ShieldCheck,
  Zap,
  TrendingUp,
  RefreshCw,
  Search,
  Pause,
  Play,
  RotateCcw,
  Globe
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'EXEC' | 'WARN';
  message: string;
}


export default function Overview() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [latency, setLatency] = useState<number | null>(24);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'AWS' | 'Docker' | 'CI/CD' | 'Monitoring' | 'General'>('Docker');


  // Search + command palette
  const [searchQuery, setSearchQuery] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Live API latency history
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);

  // Terminal Controls
  const [isLogPaused, setIsLogPaused] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'INFO', message: 'CloudOps dashboard initialized. Checking API connectivity...' },
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], message: string) => {
    if (isLogPaused) return;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: time,
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-49), newLog]);
  };

  useEffect(() => {
    if (terminalEndRef.current && !isLogPaused) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isLogPaused]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);


  // Sync API & Ping
  const fetchTasks = async () => {
    const startTime = performance.now();
    try {
      const response = await api.get<Task[]>('/api/v1/tasks/');
      const endTime = performance.now();
      const currentLatency = Math.round(endTime - startTime) || 18;
      
      setLatency(currentLatency);
      setLatencyHistory((prev) => [...prev.slice(-14), currentLatency]);
      setLastRefresh(new Date());

      if (Array.isArray(response.data)) {
        setTasks(response.data);
        if (systemStatus !== 'online') {
          setSystemStatus('online');
          addLog('SUCCESS', `API Online. Latency: ${currentLatency}ms`);
        }
      } else {
        setTasks([]);
        setSystemStatus('offline');
      }
    } catch (error) {
      setTasks([]);
      setSystemStatus('offline');
      setLatency(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 8000);
    return () => clearInterval(interval);
  }, [isLogPaused]);

  // Create a real operations task through the API
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedTitle = `[${category}] ${title.trim()}`;
    addLog('EXEC', `POST /tasks -> '${formattedTitle}'`);

    try {
      await api.post('/api/v1/tasks/', {
        title: formattedTitle,
        description,
        is_completed: false,
      });

      addLog('SUCCESS', `Task created: '${formattedTitle}'`);
      setTitle('');
      setDescription('');
      await fetchTasks();
    } catch (error) {
      addLog('ERROR', `Task creation failed: '${formattedTitle}'`);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = !task.is_completed;
    try {
      addLog('EXEC', `PUT /tasks/${task.id} -> ${nextStatus ? 'COMPLETED' : 'PENDING'}`);
      await api.put(`/api/v1/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        is_completed: nextStatus,
      });
      addLog('SUCCESS', `Task #${task.id} updated.`);
      fetchTasks();
    } catch (error) {
      addLog('ERROR', `Update failed #${task.id}`);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      addLog('WARN', `DELETE /tasks/${id}`);
      await api.delete(`/api/v1/tasks/${id}`);
      addLog('SUCCESS', `Task #${id} deleted.`);
      fetchTasks();
    } catch (error) {
      addLog('ERROR', `Delete failed #${id}`);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const successRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '100.0';

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const maxLat = Math.max(...latencyHistory, 50);
  const svgPoints = latencyHistory
    .map((val, idx) => {
      const denominator = Math.max(latencyHistory.length - 1, 1);
      const x = (idx / denominator) * 260;
      const y = 50 - (val / maxLat) * 40;
      return `${x},${y}`;
    })
    .join(' ');

  const latencyMin = latencyHistory.length ? Math.min(...latencyHistory) : null;
  const latencyMax = latencyHistory.length ? Math.max(...latencyHistory) : null;
  const latencyAvg = latencyHistory.length
    ? Math.round(latencyHistory.reduce((sum, value) => sum + value, 0) / latencyHistory.length)
    : null;

  const refreshAgeSeconds = Math.max(0, Math.floor((Date.now() - lastRefresh.getTime()) / 1000));


  return (
    <div className="space-y-6">

        {/* 1. CONTROL CENTER HEADER */}
        <header className="relative overflow-hidden bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_38%)]" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.10)]"
              >
                <Server className="w-6 h-6" />
              </motion.div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-100">
                    ☁️ CloudOps Control Plane
                  </h1>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                    PRODUCTION
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-mono mt-1">
                  AWS EC2 • eu-central-1 • Docker Compose
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border rounded-full ${
                  systemStatus === 'online' ? 'border-emerald-500/20' : 'border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    systemStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'
                  }`}
                />
                <span className="text-[11px] text-slate-400 font-mono">API</span>
                <span
                  className={`text-[11px] font-mono font-semibold ${
                    systemStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {systemStatus === 'online' ? 'HEALTHY' : 'OFFLINE'}
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-full">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-mono text-slate-300">Observability</span>
                <span className="text-[11px] font-mono text-cyan-400">ON</span>
              </div>

              <button
                type="button"
                onClick={fetchTasks}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 hover:border-blue-500/30 rounded-full transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-[11px] font-mono text-slate-400">
                  {refreshAgeSeconds}s ago
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 hover:border-blue-500/30 rounded-full text-[11px] font-mono text-slate-400 transition-all"
              >
                Ctrl K
              </button>

              <span className="text-[11px] font-mono bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20">
                v1.2.0
              </span>
            </div>
          </div>
        </header>

        {/* 2. LIVE SYSTEM METRICS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Live System Metrics
              </h2>
              <span className="text-[10px] font-mono text-slate-600">REAL APPLICATION DATA</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <motion.div whileHover={{ y: -2 }} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl hover:border-blue-500/30 hover:shadow-[0_0_25px_rgba(59,130,246,0.06)] transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Active Tasks</p>
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-bold font-mono text-slate-100">{pendingTasks}</p>
                  <span className="text-[10px] font-mono text-slate-500">{totalTasks} total</span>
                </div>
                <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((pendingTasks / Math.max(totalTasks, 1)) * 100, 100)}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl hover:border-amber-500/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.05)] transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">API Latency</p>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-bold font-mono text-amber-400">{latency ? `${latency} ms` : 'N/A'}</p>
                  <span className="text-[10px] font-mono text-slate-500">request RTT</span>
                </div>
                <svg className="w-full h-6 mt-2 overflow-visible" viewBox="0 0 260 60" preserveAspectRatio="none">
                  <motion.polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgPoints}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                </svg>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.05)] transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Task Success</p>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-bold font-mono text-emerald-400">{successRate}%</p>
                  <span className="text-[10px] font-mono text-slate-500">{completedTasks} completed</span>
                </div>
                <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${successRate}%` }} className="h-full bg-emerald-500 rounded-full" />
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.05)] transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Observability</p>
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-xl font-bold font-mono text-cyan-400">MONITORED</p>
                  <span className="text-[10px] font-mono text-slate-500">Grafana stack</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {['P', 'G', 'L', 'C', 'N'].map((item) => (
                    <span key={item} className="w-5 h-5 rounded-md border border-cyan-500/20 bg-cyan-500/5 text-[9px] font-mono text-cyan-300 flex items-center justify-center">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            whileHover={{ y: -2 }}
            className="xl:col-span-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Latency Realtime
              </span>
              <span className="text-[10px] font-mono text-emerald-400">● LIVE</span>
            </div>
            <div className="h-20 w-full flex items-end pt-3">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 260 60">
                <motion.polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPoints}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1 }}
                />
              </svg>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
              <span>API round-trip time</span>
              <span>{latency ? `${latency} ms now` : 'API unavailable'}</span>
            </div>
          </motion.div>
        </div>

        {/* 3. PRODUCTION SERVICE TOPOLOGY */}
        <section className="relative overflow-hidden bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-5">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05),transparent_45%)]" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Production Service Topology
              </h2>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Request path and core data services
              </p>
            </div>
            <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
              systemStatus === 'online'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            }`}>
              ● {systemStatus === 'online' ? 'PLATFORM OPERATIONAL' : 'API DEGRADED'}
            </span>
          </div>

          <div className="relative grid grid-cols-1 xl:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3">
            <motion.div whileHover={{ y: -3 }} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-semibold text-slate-100">Nginx</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">Reverse Proxy • :80</p>
                </div>
              </div>
            </motion.div>

            <div className="relative hidden xl:flex items-center justify-center w-16 h-6 overflow-hidden">
              <div className="absolute inset-x-0 h-px bg-slate-700" />
              <motion.span
                className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                animate={{ x: [-28, 28] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="xl:hidden text-center text-slate-600 font-mono">↓</div>

            <motion.div whileHover={{ y: -3 }} className="bg-slate-950 border border-blue-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(59,130,246,0.06)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono font-semibold text-slate-100">FastAPI</p>
                    <span className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">
                    REST API • {latency ? `${latency} ms` : 'offline'}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="relative hidden xl:flex items-center justify-center w-16 h-6 overflow-hidden">
              <div className="absolute inset-x-0 h-px bg-slate-700" />
              <motion.span
                className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]"
                animate={{ x: [-28, 28] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', delay: 0.4 }}
              />
            </div>
            <div className="xl:hidden text-center text-slate-600 font-mono">↓</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <motion.div whileHover={{ y: -3 }} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-semibold text-slate-200">PostgreSQL</p>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-500">Persistent Data</p>
                  </div>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-semibold text-slate-200">Redis</p>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-500">Cache Layer</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* PIPELINE BOARD */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  📋 OPERATIONS TASKS
                </h2>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono w-32 sm:w-40"
                    />
                  </div>
                  <button
                    onClick={fetchTasks}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Task Dispatch Form */}
              <form onSubmit={handleCreateTask} className="space-y-2">
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Docker">Docker</option>
                    <option value="AWS">AWS</option>
                                        <option value="CI/CD">CI/CD</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="General">General</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Task title (e.g. Rotate logs)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-100 flex-1 placeholder-slate-600 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono py-2 px-4 rounded-xl transition-all flex items-center gap-1 shrink-0 shadow-lg shadow-blue-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Dispatch
                  </button>
                </div>
              </form>

              {/* Column Lists */}
              <div className="space-y-4 pt-2">
                
                {/* ACTIVE TASKS */}
                <div className="space-y-2">
                  <span className="text-xs font-mono font-semibold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> PENDING / IN PROGRESS ({filteredTasks.filter((t) => !t.is_completed).length})
                  </span>
                  
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredTasks.filter((t) => !t.is_completed).map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between hover:border-amber-500/40 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-mono font-semibold text-slate-200">
                              Task #{task.id}: {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 font-mono">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleTaskStatus(task)}
                              className="px-2.5 py-1 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* COMPLETED TASKS */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED ({filteredTasks.filter((t) => t.is_completed).length})
                  </span>
                  
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredTasks.filter((t) => t.is_completed).map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="bg-slate-950/60 border border-slate-800/50 p-3.5 rounded-xl flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity"
                        >
                          <p className="text-xs font-mono text-slate-400 line-through">
                            Task #{task.id}: {task.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleTaskStatus(task)}
                              className="px-2.5 py-1 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                            >
                              Reopen
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>

            {/* API PERFORMANCE HISTORY */}
            <motion.section
              whileHover={{ y: -2 }}
              className="relative overflow-hidden bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl hover:border-blue-500/20 transition-all"
            >
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.06),transparent_42%)]" />

              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    API Performance History
                  </h2>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    Real browser → API round-trip samples
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${systemStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span className={`text-[10px] font-mono ${systemStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {systemStatus === 'online' ? 'LIVE TELEMETRY' : 'AWAITING API'}
                  </span>
                </div>
              </div>

              <div className="relative mt-5 h-48 rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                <div className="absolute inset-0 opacity-50">
                  {[20, 40, 60, 80].map((line) => (
                    <div
                      key={line}
                      className="absolute left-0 right-0 border-t border-slate-800/80"
                      style={{ top: `${line}%` }}
                    />
                  ))}
                  {[20, 40, 60, 80].map((line) => (
                    <div
                      key={line}
                      className="absolute top-0 bottom-0 border-l border-slate-800/60"
                      style={{ left: `${line}%` }}
                    />
                  ))}
                </div>

                {latencyHistory.length >= 2 ? (
                  <svg
                    className="absolute inset-0 w-full h-full p-4 overflow-visible"
                    viewBox="0 0 260 60"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="latencyArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    <motion.polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgPoints}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8 }}
                    />
                  </svg>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <Activity className="w-6 h-6 text-slate-700 mb-3" />
                    <p className="text-xs font-mono text-slate-500">
                      Waiting for real API samples
                    </p>
                    <p className="text-[10px] font-mono text-slate-700 mt-1">
                      The chart will populate automatically when the API is reachable.
                    </p>
                  </div>
                )}

                <div className="absolute left-3 bottom-2 text-[9px] font-mono text-slate-700">older</div>
                <div className="absolute right-3 bottom-2 text-[9px] font-mono text-slate-700">now</div>
              </div>

              <div className="relative grid grid-cols-3 gap-3 mt-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Min</p>
                  <p className="text-sm font-mono font-semibold text-emerald-400 mt-1">
                    {latencyMin !== null ? `${latencyMin} ms` : '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Average</p>
                  <p className="text-sm font-mono font-semibold text-blue-400 mt-1">
                    {latencyAvg !== null ? `${latencyAvg} ms` : '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Max</p>
                  <p className="text-sm font-mono font-semibold text-amber-400 mt-1">
                    {latencyMax !== null ? `${latencyMax} ms` : '—'}
                  </p>
                </div>
              </div>
            </motion.section>
          </div>

          {/* INFRASTRUCTURE HEALTH & TERMINAL */}
          <div className="lg:col-span-5 space-y-6">

            {/* DYNAMIC INFRASTRUCTURE HEALTH */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                🖥️ INFRASTRUCTURE HEALTH
              </h2>
              <div className="space-y-3 font-mono text-xs">
                
                {/* PostgreSQL */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-200">
                      <Database className="w-4 h-4 text-indigo-400" /> PostgreSQL Database
                    </span>
                    <span className="text-slate-400 text-[11px]">● Docker Compose</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Persistent relational storage</p>
                </div>

                {/* Nginx */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Nginx Reverse Proxy
                    </span>
                    <span className="text-slate-400 text-[11px]">● Edge Service</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Routes frontend, API and Grafana traffic</p>
                </div>

                {/* FastAPI */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-200">
                      <Zap className="w-4 h-4 text-amber-400" /> FastAPI Backend
                    </span>
                    <span
                      className={`text-[11px] ${
                        systemStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      ● {systemStatus === 'online' ? 'Healthy' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">REST API • PostgreSQL • Redis</p>
                </div>

                {/* Observability */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-slate-200">
                      <Activity className="w-4 h-4 text-cyan-400" /> Observability Stack
                    </span>
                    <span className="text-cyan-400 text-[11px]">● Grafana</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Prometheus • Loki • Promtail • cAdvisor • Node Exporter
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIVITY STREAM */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> LIVE EVENT STREAM
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsLogPaused(!isLogPaused)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {isLogPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                  </button>
                  <button
                    onClick={() => setLogs([])}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 font-mono text-[11px] h-48 overflow-y-auto space-y-1.5">
                <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-1.5 leading-tight"
                  >
                    <span className="text-slate-600 font-mono select-none">[{log.timestamp}]</span>
                    <span
                      className={`font-semibold text-[10px] ${
                        log.type === 'SUCCESS'
                          ? 'text-emerald-400'
                          : log.type === 'EXEC'
                          ? 'text-amber-400'
                          : log.type === 'WARN'
                          ? 'text-amber-300'
                          : log.type === 'ERROR'
                          ? 'text-rose-400'
                          : 'text-blue-400'
                      }`}
                    >
                      [{log.type}]
                    </span>
                    <span className="text-slate-300">{log.message}</span>
                  </motion.div>
                ))}
                </AnimatePresence>
                <div className="text-emerald-400 animate-pulse font-mono flex items-center gap-1">
                  <span>&gt;_</span>
                </div>
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>

        </div>


        <AnimatePresence>
          {commandPaletteOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
              onMouseDown={() => setCommandPaletteOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                onMouseDown={(event) => event.stopPropagation()}
                className="w-full max-w-xl overflow-hidden bg-slate-900 border border-slate-700 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
              >
                <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
                  <Search className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-mono text-slate-300">CloudOps Command Palette</span>
                  <span className="ml-auto text-[10px] font-mono text-slate-600">ESC</span>
                </div>

                <div className="p-2 space-y-1">
                  {[
                    { label: 'Refresh dashboard', hint: 'Fetch API state and tasks', action: () => fetchTasks() },
                    { label: 'Open Grafana', hint: '/grafana/', action: () => window.open('/grafana/', '_blank') },
                    { label: 'Open API docs', hint: '/docs', action: () => window.open('/docs', '_blank') },
                    { label: 'Check API health', hint: '/api/v1/health', action: () => window.open('/api/v1/health', '_blank') },
                    { label: 'Open GitHub repository', hint: 'viktors1996/cloudops-platform', action: () => window.open('https://github.com/viktors1996/cloudops-platform', '_blank') },
                  ].map((command) => (
                    <button
                      key={command.label}
                      type="button"
                      onClick={() => {
                        command.action();
                        setCommandPaletteOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-4 px-3 py-3 rounded-xl text-left hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all group"
                    >
                      <span className="text-sm font-mono text-slate-200 group-hover:text-white">{command.label}</span>
                      <span className="text-[10px] font-mono text-slate-600">{command.hint}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}