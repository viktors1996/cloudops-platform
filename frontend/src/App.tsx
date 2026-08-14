import React, { useState, useEffect, useRef } from 'react';
import { api, type Task } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Activity,
  CheckCircle2,
  XCircle,
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
  Cpu,
  HardDrive,
  Globe
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'EXEC' | 'WARN';
  message: string;
}

interface DeployingTask {
  tempId: string;
  title: string;
  category: string;
  progress: number;
  stage: string;
}

interface ClusterNode {
  id: string;
  name: string;
  region: string;
  status: 'healthy' | 'busy' | 'degraded';
  cpu: number;
  ram: number;
  pods: number;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [latency, setLatency] = useState<number | null>(24);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'AWS' | 'Docker' | 'K8s' | 'CI/CD' | 'General'>('Docker');

  // Active Deployments State
  const [deployments, setDeployments] = useState<DeployingTask[]>([]);

  // Cluster Nodes State
  const [nodes, setNodes] = useState<ClusterNode[]>([
    { id: 'node-1', name: 'us-east-master-1', region: 'us-east-1', status: 'healthy', cpu: 32, ram: 54, pods: 12 },
    { id: 'node-2', name: 'eu-central-worker-1', region: 'eu-central-1', status: 'healthy', cpu: 68, ram: 72, pods: 28 },
    { id: 'node-3', name: 'ap-south-worker-2', region: 'ap-south-1', status: 'busy', cpu: 89, ram: 81, pods: 34 },
  ]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Live Stats
  const [latencyHistory, setLatencyHistory] = useState<number[]>([25, 30, 18, 24, 22, 19, 35, 20, 17, 24]);
  const [postgresCpu, setPostgresCpu] = useState(12);
  const [nginxReq, setNginxReq] = useState(1.2);
  const [fastApiRam, setFastApiRam] = useState(180);

  // Terminal Controls
  const [isLogPaused, setIsLogPaused] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }), type: 'INFO', message: 'Control Plane Node online. Ready.' },
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

  // Dynamic hardware & nodes simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPostgresCpu(Math.floor(10 + Math.random() * 8));
      setNginxReq(Number((1.1 + Math.random() * 0.3).toFixed(2)));
      setFastApiRam(Math.floor(175 + Math.random() * 15));

      // Fluctuate cluster nodes usage
      setNodes((prev) =>
        prev.map((n) => {
          const cpuDelta = Math.floor(Math.random() * 7) - 3;
          const newCpu = Math.min(Math.max(n.cpu + cpuDelta, 15), 95);
          return {
            ...n,
            cpu: newCpu,
            status: newCpu > 85 ? 'busy' : 'healthy',
          };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
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

  // LIVE DEPLOYMENT SIMULATOR
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedTitle = `[${category}] ${title}`;
    const tempId = Math.random().toString(36).substring(2, 7);

    const newDeploy: DeployingTask = {
      tempId,
      title: formattedTitle,
      category,
      progress: 10,
      stage: 'Provisioning container...',
    };

    setDeployments((prev) => [...prev, newDeploy]);
    addLog('EXEC', `Pipeline initialized for '${formattedTitle}'`);
    setTitle('');
    setDescription('');

    // Stage 1: Building
    setTimeout(() => {
      setDeployments((prev) =>
        prev.map((d) => (d.tempId === tempId ? { ...d, progress: 45, stage: 'Building Docker image...' } : d))
      );
      addLog('INFO', `[${tempId}] Building image & injecting dependencies...`);
    }, 1200);

    // Stage 2: Healthchecks
    setTimeout(() => {
      setDeployments((prev) =>
        prev.map((d) => (d.tempId === tempId ? { ...d, progress: 80, stage: 'Running readiness probes...' } : d))
      );
      addLog('INFO', `[${tempId}] Probing healthchecks on port 8000...`);
    }, 2600);

    // Final Stage: Save to DB & Complete
    setTimeout(async () => {
      try {
        await api.post('/api/v1/tasks/', {
          title: formattedTitle,
          description,
          is_completed: false,
        });
        addLog('SUCCESS', `Deployed successfully: '${formattedTitle}'`);
        fetchTasks();
      } catch (err) {
        addLog('ERROR', `Deployment failed for '${formattedTitle}'`);
      } finally {
        setDeployments((prev) => prev.filter((d) => d.tempId !== tempId));
      }
    }, 4000);
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
      const x = (idx / (latencyHistory.length - 1)) * 260;
      const y = 50 - (val / maxLat) * 40;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Server className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                ☁️ CloudOps Control Plane
              </h1>
              <p className="text-slate-400 text-xs font-mono">Orchestration & Infrastructure Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-full">
              <span className="text-xs text-slate-400 font-mono">API Status:</span>
              {systemStatus === 'online' ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Healthy
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium font-mono">
                  <XCircle className="w-3.5 h-3.5" /> Offline
                </span>
              )}
            </div>

            <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
              v1.2.0
            </span>
          </div>
        </header>

        {/* 2. METRICS & GRAPH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> LIVE SYSTEM METRICS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
                <p className="text-[11px] font-mono text-slate-400">🚀 Active</p>
                <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{pendingTasks} Pipelines</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
                <p className="text-[11px] font-mono text-slate-400">⚡ Latency</p>
                <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">{latency ? `${latency} ms` : 'N/A'}</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
                <p className="text-[11px] font-mono text-slate-400">✅ Success</p>
                <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{successRate}%</p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
                <p className="text-[11px] font-mono text-slate-400">⏱️ Uptime</p>
                <p className="text-lg font-bold font-mono text-indigo-400 mt-0.5">14d 08h</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Latency Realtime (ms)
              </span>
              <span className="text-[10px] font-mono text-emerald-400">● Live</span>
            </div>
            
            <div className="h-16 w-full flex items-end pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 260 60">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPoints}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* NEW FEATURE: 3. CLUSTER NODES MAP */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> KUBERNETES / DOCKER CLUSTER MAP
            </h2>
            <span className="text-[11px] font-mono text-slate-400">3 Nodes Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="group relative bg-slate-950 border border-slate-800 p-3.5 rounded-xl hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        node.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-xs font-mono font-semibold text-slate-200">{node.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {node.region}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Cpu className="w-3 h-3 text-cyan-400" /> CPU: <span className="text-slate-200">{node.cpu}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <HardDrive className="w-3 h-3 text-indigo-400" /> RAM: <span className="text-slate-200">{node.ram}%</span>
                  </div>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-2xl pointer-events-none z-20 font-mono text-[10px]">
                  <p className="text-cyan-400 font-bold mb-1">Node Specs:</p>
                  <p className="text-slate-300">Pods Running: {node.pods}/50</p>
                  <p className="text-slate-300">Driver: overlay2</p>
                  <p className="text-slate-300">OS: Ubuntu 24.04 LTS</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. MAIN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* PIPELINE BOARD */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  📋 PIPELINE BOARD (TASKS)
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
                    <option value="K8s">K8s</option>
                    <option value="CI/CD">CI/CD</option>
                    <option value="General">General</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Task Title (e.g. Deploy Redis Cluster)"
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

              {/* LIVE DEPLOYMENTS IN PROGRESS */}
              <AnimatePresence>
                {deployments.length > 0 && (
                  <div className="space-y-2 border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono text-blue-400 animate-pulse flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> ACTIVE BUILDING PIPELINES ({deployments.length})
                    </span>
                    {deployments.map((dep) => (
                      <motion.div
                        key={dep.tempId}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-blue-950/30 border border-blue-500/30 p-3 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-200 font-semibold">{dep.title}</span>
                          <span className="text-blue-400">{dep.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${dep.progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-400" /> {dep.stage}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

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
          </div>

          {/* INFRASTRUCTURE HEALTH & TERMINAL */}
          <div className="lg:col-span-5 space-y-6">

            {/* DYNAMIC INFRASTRUCTURE HEALTH */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                🖥️ INFRASTRUCTURE HEALTH
              </h2>
              <div className="space-y-3 font-mono text-xs">
                
                {/* Postgres Card */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-200">
                      <Database className="w-4 h-4 text-indigo-400" /> PostgreSQL Database
                    </span>
                    <span className="text-emerald-400 text-[11px]">● Online</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>CPU Utilization</span>
                      <span>{postgresCpu}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${postgresCpu * 3}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Nginx Card */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Nginx Reverse Proxy
                    </span>
                    <span className="text-emerald-400 text-[11px]">● Online</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Traffic Throughput</span>
                      <span>{nginxReq}k req/s</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(nginxReq / 2) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* FastAPI Card */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-200">
                      <Zap className="w-4 h-4 text-amber-400" /> FastAPI Engine
                    </span>
                    <span className="text-emerald-400 text-[11px]">● Online</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>RAM Consumption</span>
                      <span>{fastApiRam} MB</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(fastApiRam / 500) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* LIVE TERMINAL LOGS */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" /> LIVE TERMINAL LOGS
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
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-1.5 leading-tight">
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
                  </div>
                ))}
                <div className="text-emerald-400 animate-pulse font-mono flex items-center gap-1">
                  <span>&gt;_</span>
                </div>
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}