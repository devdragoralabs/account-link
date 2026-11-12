import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  Power,
  Sliders,
  Terminal as TerminalIcon,
  Server,
  Zap,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  FileCode,
  Layers,
  Database
} from 'lucide-react';

export interface ServiceItem {
  id: string;
  name: string;
  endpoint: string;
  type: string;
  latency: string;
  status: 'active' | 'synced' | 'optimal';
  icon: React.ElementType;
  protocol?: string;
  port?: string;
  throughput?: string;
  uptime?: string;
  memory?: string;
  description?: string;
  logs?: string[];
}

interface ServiceManagePageProps {
  service: ServiceItem;
  section: 'home' | 'account' | 'admin';
  onBack: () => void;
  onUpdateStatus?: (newStatus: 'active' | 'synced' | 'optimal') => void;
}

interface EnvVar {
  key: string;
  value: string;
}

export function ServiceManagePage({
  service,
  section,
  onBack,
  onUpdateStatus
}: ServiceManagePageProps) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'env' | 'terminal' | 'network' | 'danger'>('metrics');
  const [isRestarting, setIsRestarting] = useState(false);
  const [isDraining, setIsDraining] = useState(false);
  const [replicas, setReplicas] = useState(3);
  const [isPinging, setIsPinging] = useState(false);
  const [currentLatency, setCurrentLatency] = useState(service.latency);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Environment Variables State
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: 'NODE_ENV', value: 'production' },
    { key: 'CLUSTER_NAME', value: 'cluster-alpha-01' },
    { key: 'SERVICE_PORT', value: service.port?.replace(':', '') || '443' },
    { key: 'LOG_LEVEL', value: 'info' },
    { key: 'ENABLE_TELEMETRY', value: 'true' },
    { key: 'MAX_CONNECTION_POOL', value: '64' }
  ]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isSavingEnv, setIsSavingEnv] = useState(false);

  // Terminal & Logs State
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    `[SYS] Connected to remote node ${service.name} (${service.endpoint})`,
    `[SYS] Type 'help' to inspect available management commands.`,
    `13:42:00.120 [INFO] Pod initialized with TLS 1.3 cryptographic socket`,
    `13:42:01.004 [OK] Healthcheck 200 OK received in 1.4ms`
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Network & Rate Limits
  const [rateLimit, setRateLimit] = useState(5000);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Keyboard shortcut: Esc to return to dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Handle Ping Node
  const handlePing = () => {
    setIsPinging(true);
    setTimeout(() => {
      const rand = Math.floor(Math.random() * 6) + 2;
      const res = `${rand}ms`;
      setCurrentLatency(res);
      setIsPinging(false);
      showToast(`Ping probe returned ${res} roundtrip`);
      setTerminalHistory((prev) => [
        ...prev,
        `[PING] 64 bytes from ${service.endpoint}: icmp_seq=1 ttl=58 time=${rand}.12 ms`
      ]);
    }, 450);
  };

  // Handle Restart Service
  const handleRestart = () => {
    setIsRestarting(true);
    showToast(`Restarting ${service.name}...`);
    setTerminalHistory((prev) => [
      ...prev,
      `[SYS] SIGTERM received for ${service.name} (pid 1420)`,
      `[SYS] Draining inflight connections...`,
      `[SYS] Spawning fresh worker thread...`
    ]);

    setTimeout(() => {
      setIsRestarting(false);
      showToast(`Service ${service.name} rebooted successfully!`);
      setTerminalHistory((prev) => [
        ...prev,
        `[SYS] Worker re-attached to socket ${service.endpoint} (pid 1428)`,
        `[OK] Readiness probe returned 200 OK`
      ]);
      if (onUpdateStatus) onUpdateStatus('active');
    }, 1200);
  };

  // Handle Terminal Submit
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const newHistory = [...terminalHistory, `admin@${service.name}:~$ ${cmd}`];

    switch (cmd.toLowerCase()) {
      case 'help':
        newHistory.push(
          '  status     - Show health, uptime, and throughput',
          '  ping       - Send ICMP probe packets to endpoint',
          '  restart    - Trigger zero-downtime service restart',
          '  drain      - Toggle inbound traffic draining',
          '  env        - List active environment configuration',
          '  clear      - Clear terminal screen'
        );
        break;
      case 'status':
        newHistory.push(
          `  Name:        ${service.name}`,
          `  Status:      ${maintenanceMode ? 'MAINTENANCE' : isDraining ? 'DRAINING' : 'ONLINE'}`,
          `  Latency:     ${currentLatency}`,
          `  Throughput:  ${service.throughput || '4,820 req/s'}`,
          `  Uptime:      ${service.uptime || '99.99%'}`,
          `  Instances:   ${replicas} pods ready`
        );
        break;
      case 'ping':
        newHistory.push(
          `PING ${service.endpoint} (10.240.0.42): 56 data bytes`,
          `64 bytes: icmp_seq=0 time=2.12ms`,
          `64 bytes: icmp_seq=1 time=1.98ms`,
          `--- ${service.endpoint} ping statistics ---`,
          `2 packets transmitted, 2 received, 0% packet loss`
        );
        break;
      case 'restart':
        handleRestart();
        break;
      case 'drain':
        setIsDraining((prev) => !prev);
        newHistory.push(`[TRAFFIC] Draining state toggled: ${!isDraining}`);
        break;
      case 'env':
        envVars.forEach((ev) => {
          newHistory.push(`  ${ev.key}=${ev.value}`);
        });
        break;
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      default:
        newHistory.push(`command not found: ${cmd}. Type 'help' for available commands.`);
        break;
    }

    setTerminalHistory(newHistory);
    setTerminalInput('');
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(service.endpoint);
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 1500);
      showToast('Endpoint copied to clipboard');
    } catch {
      showToast('Failed to copy endpoint');
    }
  };

  const handleAddEnvVar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setEnvVars((prev) => [...prev, { key: newKey.trim().toUpperCase(), value: newValue.trim() }]);
    setNewKey('');
    setNewValue('');
    showToast('Variable staged');
  };

  const handleDeleteEnvVar = (idx: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== idx));
    showToast('Variable removed');
  };

  const handleSaveEnv = () => {
    setIsSavingEnv(true);
    setTimeout(() => {
      setIsSavingEnv(false);
      showToast('Environment variables applied to cluster!');
      setTerminalHistory((prev) => [
        ...prev,
        `[CONFIG] Hot-reload triggered with ${envVars.length} environment variables`
      ]);
    }, 600);
  };

  const ServiceIcon = service.icon || Server;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950/95 text-neutral-200 font-mono text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card with Back Button & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-900 bg-neutral-950/90 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-all active:scale-95"
            title="Back to Dashboard (Esc)"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <div className="h-5 w-px bg-neutral-800" />

          {/* Breadcrumb Info */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
              <ServiceIcon size={16} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                  Cluster &bull; {section} &bull; Manage
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-base font-semibold text-white font-mono tracking-tight truncate">
                {service.name}
              </h1>
            </div>
          </div>
        </div>

        {/* Top Control Bar Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Quick Endpoint Copy */}
          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-mono transition-colors"
            title={`Copy ${service.endpoint}`}
          >
            {copiedEndpoint ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="truncate max-w-[140px] sm:max-w-none">{service.endpoint}</span>
          </button>

          {/* Ping Probe */}
          <button
            type="button"
            onClick={handlePing}
            disabled={isPinging}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs font-mono transition-colors disabled:opacity-50"
            title="Send live ICMP ping probe"
          >
            <Radio size={13} className={isPinging ? 'text-emerald-400 animate-pulse' : 'text-neutral-400'} />
            <span>{isPinging ? 'Probing...' : currentLatency}</span>
          </button>

          {/* Restart Service */}
          <button
            type="button"
            onClick={handleRestart}
            disabled={isRestarting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-mono transition-all disabled:opacity-50 active:scale-95"
            title="Perform graceful restart"
          >
            <RotateCcw size={13} className={isRestarting ? 'animate-spin text-emerald-400' : 'text-neutral-400'} />
            <span>{isRestarting ? 'Restarting...' : 'Restart'}</span>
          </button>
        </div>
      </div>

      {/* Primary Management Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-900 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all backdrop-blur-sm ${
            activeTab === 'metrics'
              ? 'bg-neutral-900 border border-neutral-700 text-white font-medium'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950/60 border border-transparent'
          }`}
        >
          <Activity size={14} className={activeTab === 'metrics' ? 'text-emerald-400' : ''} />
          <span>Telemetry & Metrics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('env')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all backdrop-blur-sm ${
            activeTab === 'env'
              ? 'bg-neutral-900 border border-neutral-700 text-white font-medium'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950/60 border border-transparent'
          }`}
        >
          <Sliders size={14} className={activeTab === 'env' ? 'text-blue-400' : ''} />
          <span>Configuration & Env</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all backdrop-blur-sm ${
            activeTab === 'terminal'
              ? 'bg-neutral-900 border border-neutral-700 text-white font-medium'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950/60 border border-transparent'
          }`}
        >
          <TerminalIcon size={14} className={activeTab === 'terminal' ? 'text-amber-400' : ''} />
          <span>Terminal & Live Logs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all backdrop-blur-sm ${
            activeTab === 'network'
              ? 'bg-neutral-900 border border-neutral-700 text-white font-medium'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950/60 border border-transparent'
          }`}
        >
          <Globe size={14} className={activeTab === 'network' ? 'text-purple-400' : ''} />
          <span>Networking & Ingress</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all backdrop-blur-sm ${
            activeTab === 'danger'
              ? 'bg-neutral-900 border border-red-900/60 text-red-400 font-medium'
              : 'text-neutral-500 hover:text-red-400 hover:bg-neutral-950/60 border border-transparent'
          }`}
        >
          <AlertTriangle size={14} />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* TAB 1: TELEMETRY & METRICS */}
      {activeTab === 'metrics' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* 3 Mid Cards with Progress Bars matching user style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: CPU & Core Utilization */}
            <div className="interactive-card p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                    <Cpu size={16} className="text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-400">
                    Optimal
                  </span>
                </div>
                <h2 className="text-xs font-medium text-neutral-400">Compute Load</h2>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tracking-tight text-white font-mono">
                    21.4%
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">/ 4 dedicated vCPUs</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-900">
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full w-[21.4%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>Usage: 0.86 GHz</span>
                  <span>Target: &lt; 70%</span>
                </div>
              </div>
            </div>

            {/* Card 2: Memory & Working Set */}
            <div className="interactive-card p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                    <Layers size={16} className="text-blue-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                    Normal
                  </span>
                </div>
                <h2 className="text-xs font-medium text-neutral-400">Memory Allocation</h2>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tracking-tight text-white font-mono">
                    {service.memory || '312 MB'}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">/ 1,024 MB Limit</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-900">
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2">
                  <div className="bg-blue-400 h-1.5 rounded-full w-[30.5%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>Resident Set Size (RSS)</span>
                  <span>30.5% used</span>
                </div>
              </div>
            </div>

            {/* Card 3: Ingress Throughput & SLA */}
            <div className="interactive-card p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                    <Zap size={16} className="text-amber-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/50 border border-amber-800/40 text-amber-400">
                    {service.uptime || '99.99%'} SLA
                  </span>
                </div>
                <h2 className="text-xs font-medium text-neutral-400">Active Throughput</h2>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tracking-tight text-white font-mono">
                    {service.throughput || '4,820 req/s'}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">peak bandwidth</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-900">
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2">
                  <div className="bg-amber-400 h-1.5 rounded-full w-[65%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>Latency: {currentLatency}</span>
                  <span>0 dropped packets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Node Specification & Scaling Console */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                  <Server size={15} className="text-emerald-400" />
                  Container Instance & Scaling Topology
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Dynamic replica scaling across Kubernetes worker nodes
                </p>
              </div>

              {/* Scaling Replicas Controller */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-neutral-400">Replicas:</span>
                <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (replicas > 1) {
                        setReplicas(replicas - 1);
                        showToast(`Scaled to ${replicas - 1} pods`);
                      }
                    }}
                    disabled={replicas <= 1}
                    className="w-7 h-7 flex items-center justify-center text-xs font-mono text-neutral-400 hover:text-white disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-9 text-center text-xs font-mono text-white font-bold">
                    {replicas}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (replicas < 12) {
                        setReplicas(replicas + 1);
                        showToast(`Scaled to ${replicas + 1} pods`);
                      }
                    }}
                    disabled={replicas >= 12}
                    className="w-7 h-7 flex items-center justify-center text-xs font-mono text-neutral-400 hover:text-white disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Spec Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/30">
                <span className="text-[10px] text-neutral-500 uppercase block">Protocol</span>
                <span className="text-neutral-200 mt-1 block truncate">
                  {service.protocol || 'HTTP/2 TLS 1.3'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/30">
                <span className="text-[10px] text-neutral-500 uppercase block">Port Binding</span>
                <span className="text-neutral-200 mt-1 block">
                  {service.port || ':443'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/30">
                <span className="text-[10px] text-neutral-500 uppercase block">Health SLA</span>
                <span className="text-emerald-400 mt-1 block">
                  {service.uptime || '99.99%'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/30">
                <span className="text-[10px] text-neutral-500 uppercase block">Execution Mode</span>
                <span className="text-neutral-200 mt-1 block">
                  Cluster Authoritative
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURATION & ENVIRONMENT VARIABLES */}
      {activeTab === 'env' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                  <Sliders size={15} className="text-blue-400" />
                  Environment Variables & Key-Value Parameters
                </h3>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Injected into runtime containers upon boot and configuration rollout
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveEnv}
                disabled={isSavingEnv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-black font-mono text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
              >
                {isSavingEnv ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                <span>{isSavingEnv ? 'Applying...' : 'Apply Changes'}</span>
              </button>
            </div>

            {/* Env Table */}
            <div className="divide-y divide-neutral-900 border border-neutral-900 rounded-lg overflow-hidden font-mono text-xs">
              {envVars.map((ev, idx) => (
                <div key={idx} className="p-3 bg-black/60 flex items-center justify-between gap-3 hover:bg-neutral-900/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-emerald-400 font-semibold truncate w-44">
                      {ev.key}
                    </span>
                    <span className="text-neutral-600 select-none">=</span>
                    <input
                      type="text"
                      value={ev.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEnvVars((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, value: val } : item))
                        );
                      }}
                      className="bg-neutral-900/60 border border-neutral-800 rounded px-2.5 py-1 text-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-600 flex-1 min-w-0"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteEnvVar(idx)}
                    className="p-1 rounded text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Remove variable"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Key-Value Form */}
            <form onSubmit={handleAddEnvVar} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="VARIABLE_NAME"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full sm:w-1/3 bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 uppercase"
              />
              <input
                type="text"
                placeholder="value_or_token"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full sm:flex-1 bg-neutral-900/80 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
              />
              <button
                type="submit"
                disabled={!newKey.trim()}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-mono transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus size={13} />
                <span>Add Variable</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: TERMINAL & LIVE LOGS */}
      {activeTab === 'terminal' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="rounded-xl border border-neutral-900 bg-black/95 shadow-2xl overflow-hidden backdrop-blur-md font-mono text-xs">
            {/* Terminal Titlebar with macOS traffic dots */}
            <div className="px-4 py-2.5 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                <span className="text-[11px] text-neutral-500 ml-2">
                  admin@{service.name}: /var/log/cluster
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>TTY LIVE</span>
              </div>
            </div>

            {/* Terminal Output Area */}
            <div className="p-4 h-72 overflow-y-auto space-y-1.5 text-neutral-300 select-text">
              {terminalHistory.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  {line.startsWith('admin@') ? (
                    <span className="text-emerald-400 font-bold">{line}</span>
                  ) : line.includes('[INFO]') ? (
                    <span className="text-neutral-300">{line}</span>
                  ) : line.includes('[OK]') ? (
                    <span className="text-emerald-400">{line}</span>
                  ) : line.includes('[SYS]') ? (
                    <span className="text-blue-400">{line}</span>
                  ) : (
                    <span className="text-neutral-400">{line}</span>
                  )}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Command Input */}
            <form onSubmit={handleTerminalSubmit} className="border-t border-neutral-900 p-2.5 bg-neutral-950/80 flex items-center gap-2">
              <span className="text-emerald-500 select-none pl-2">&gt;</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type 'help', 'status', 'ping', 'restart', 'env'..."
                className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none placeholder-neutral-700"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[11px] font-mono transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: NETWORKING & INGRESS */}
      {activeTab === 'network' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="p-5 rounded-xl border border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-2xl space-y-5">
            <div className="border-b border-neutral-900 pb-3">
              <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                <Globe size={15} className="text-purple-400" />
                Network Ingress & Rate Limiting Controls
              </h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Edge firewall parameters and cryptographic transport settings
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Rate Limit Slider */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/30 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Max Inbound Rate Limit:</span>
                  <span className="text-emerald-400 font-bold">{rateLimit.toLocaleString()} req/s</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={rateLimit}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRateLimit(val);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Excess requests will be throttled with HTTP 429 Too Many Requests.
                </span>
              </div>

              {/* Traffic Draining Toggle */}
              <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/30 flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs text-neutral-300 block font-medium">Drain Traffic</span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Gracefully stop accepting new connections
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDraining(!isDraining);
                    showToast(`Traffic draining ${!isDraining ? 'enabled' : 'disabled'}`);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    isDraining
                      ? 'border-amber-600 bg-amber-950/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {isDraining ? 'Draining' : 'Active'}
                </button>
              </div>
            </div>

            {/* SSL/TLS Cipher Specs */}
            <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/30 font-mono text-xs space-y-2">
              <span className="text-neutral-400 font-medium block">Cryptographic TLS Profile:</span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-emerald-400">
                  TLS 1.3 Strict
                </span>
                <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                  Cipher: TLS_AES_256_GCM_SHA384
                </span>
                <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                  Auto-Renew: ACME Let&apos;s Encrypt
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DANGER ZONE */}
      {activeTab === 'danger' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-5 rounded-xl border border-red-900/40 bg-neutral-950/90 backdrop-blur-md shadow-2xl space-y-4">
            <div className="border-b border-red-900/30 pb-3">
              <h3 className="text-sm font-semibold text-red-400 font-mono flex items-center gap-2">
                <AlertTriangle size={15} />
                Privileged & Destructive Service Actions
              </h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Actions here impact live cluster operations and traffic routing
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Maintenance Mode */}
              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-900/30 flex items-center justify-between">
                <div>
                  <span className="text-neutral-200 font-medium block">Cluster Maintenance Mode</span>
                  <span className="text-[10px] text-neutral-500">
                    Returns HTTP 503 Maintenance to non-admin inbound requests
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMaintenanceMode(!maintenanceMode);
                    showToast(`Maintenance mode ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    maintenanceMode
                      ? 'border-red-600 bg-red-950/40 text-red-300'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {maintenanceMode ? 'Active (503)' : 'Disabled'}
                </button>
              </div>

              {/* Force Cache Flush */}
              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-900/30 flex items-center justify-between">
                <div>
                  <span className="text-neutral-200 font-medium block">Flush Local Memory Buffer</span>
                  <span className="text-[10px] text-neutral-500">
                    Purges active volatile cache keys for this component
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Memory buffer flushed')}
                  className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  Flush Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
