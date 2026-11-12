import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Copy,
  Check,
  Download,
  Filter,
  Search,
  Maximize2,
  Minimize2,
  Radio,
  ArrowDownCircle
} from 'lucide-react';

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'NET' | 'AUTH' | 'KERNEL';
  subsystem: string;
  message: string;
}

const INITIAL_LOGS: TerminalLogEntry[] = [
  {
    id: 'l-1',
    timestamp: '23:25:01.102',
    level: 'KERNEL',
    subsystem: 'netfilter',
    message: 'conntrack: table 262144 entries, 420 active TCP flows (SYN_ACK verified)'
  },
  {
    id: 'l-2',
    timestamp: '23:25:04.281',
    level: 'NET',
    subsystem: 'wireguard.wg0',
    message: 'Handshake completed with peer node-02 (endpoint 10.240.0.12:51820) - RTT 0.31ms'
  },
  {
    id: 'l-3',
    timestamp: '23:25:07.410',
    level: 'AUTH',
    subsystem: 'pam_totp',
    message: 'Superadmin session authenticated via hardware TOTP RFC-6238 token (SHA-256)'
  },
  {
    id: 'l-4',
    timestamp: '23:25:11.890',
    level: 'INFO',
    subsystem: 'cluster.mesh',
    message: 'Node control-plane-primary health check PASS - all 16 mesh nodes synced'
  },
  {
    id: 'l-5',
    timestamp: '23:25:15.004',
    level: 'NET',
    subsystem: 'ipv6.route',
    message: 'Route 2600:1f18:6320::/64 dispatched to next-hop fe80::1 via device eth0 (MTU: 1500)'
  },
  {
    id: 'l-6',
    timestamp: '23:25:18.332',
    level: 'WARN',
    subsystem: 'ingress.waf',
    message: 'Rate-limiter: client 198.51.100.41 burst threshold warning (120 req/s > 100 limit)'
  },
  {
    id: 'l-7',
    timestamp: '23:25:22.901',
    level: 'INFO',
    subsystem: 'tls.vault',
    message: 'mTLS handshake: TLS_AES_256_GCM_SHA384 cipher suite confirmed on port 443'
  }
];

const LOG_TEMPLATES = [
  { level: 'INFO', sub: 'cluster.mesh', msg: 'Node worker-compute-fleet-a heartbeat ACK received (rtt: 0.28ms)' },
  { level: 'NET', sub: 'tcp.bbr', msg: 'BBR congestion control: pacing rate adjusted to 9.8 Gbps on eth0' },
  { level: 'AUTH', sub: 'rbac.enforcer', msg: 'Cluster authorization token verified: role: Superadmin (L5 clearance)' },
  { level: 'KERNEL', sub: 'fs.nvme', msg: 'NVMe trim discard cycle complete: 412 MB freed across pool nvme0n1' },
  { level: 'NET', sub: 'dns.resolver', msg: 'DNS query cluster.local resolved via primary upstream 1.1.1.1 in 1.4ms' },
  { level: 'WARN', sub: 'ingress.proxy', msg: 'Upstream HTTP keepalive connection recycled after 300s idle timeout' },
  { level: 'INFO', sub: 'ingress.edge', msg: 'Ingress throughput stable: 4,890 req/s, 0 dropped frames' },
  { level: 'NET', sub: 'ipv4.arp', msg: 'Gratuitous ARP broadcast announced for custom VIP 192.168.1.150' },
  { level: 'AUTH', sub: 'vault.mtls', msg: 'Automated mTLS certificate chain validation completed: 89 days remaining' },
  { level: 'KERNEL', sub: 'cgroup.v2', msg: 'Container runtime cgroup memory pressure: 0.00% (healthy state)' },
  { level: 'INFO', sub: 'node.telemetry', msg: 'System load average 0.42, 0.58, 0.51 - CPU thermal 41°C (optimal)' }
] as const;

export function SystemLogsTerminal() {
  const [logs, setLogs] = useState<TerminalLogEntry[]>(INITIAL_LOGS);
  const [isStreaming, setIsStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  // Live streaming simulation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];

      const newEntry: TerminalLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        level: template.level as TerminalLogEntry['level'],
        subsystem: template.sub,
        message: template.msg
      };

      setLogs(prev => {
        const next = [...prev, newEntry];
        return next.length > 200 ? next.slice(next.length - 200) : next;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (selectedLevel !== 'ALL' && log.level !== selectedLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.subsystem.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp}] [${l.level}] [${l.subsystem}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportLogs = () => {
    const text = logs
      .map(l => `[${l.timestamp}] [${l.level}] [${l.subsystem}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cluster-system-logs-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: TerminalLogEntry['level']) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400 bg-red-950/40 border-red-800/40';
      case 'WARN':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
      case 'NET':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/40';
      case 'AUTH':
        return 'text-blue-400 bg-blue-950/40 border-blue-800/40';
      case 'KERNEL':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
      default:
        return 'text-neutral-300 bg-neutral-900 border-neutral-800';
    }
  };

  return (
    <div className={`rounded-xl border border-neutral-900 bg-black font-mono transition-all duration-300 flex flex-col shadow-2xl overflow-hidden ${
      isExpanded ? 'h-[580px]' : 'h-[360px]'
    }`}>
      {/* Terminal Titlebar with macOS Window Controls */}
      <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Traffic Light Dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/40" />
          </div>

          <div className="h-3.5 w-px bg-neutral-800 mx-1" />

          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-white tracking-wide">System Logs Terminal</span>
            <span className="text-[10px] text-neutral-500 hidden sm:inline">
              journalctl -u cluster-mesh -f
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] text-neutral-400 uppercase">
              {isStreaming ? 'Streaming' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative hidden md:block">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="w-36 pl-7 pr-2.5 py-1 bg-black border border-neutral-800 rounded-lg text-[11px] text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-1">
            {['ALL', 'INFO', 'NET', 'AUTH', 'WARN'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  selectedLevel === lvl
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="h-3.5 w-px bg-neutral-800 mx-0.5" />

          {/* Pause / Resume */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isStreaming
                ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
            }`}
            title={isStreaming ? 'Pause live stream' : 'Resume live stream'}
          >
            {isStreaming ? <Pause size={12} /> : <Play size={12} />}
          </button>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              autoScroll
                ? 'bg-neutral-900 border-neutral-800 text-white'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
            title="Auto-scroll to bottom"
          >
            <ArrowDownCircle size={12} />
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
            title="Copy current filtered logs"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>

          {/* Download Logs */}
          <button
            onClick={handleExportLogs}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
            title="Export raw log file"
          >
            <Download size={12} />
          </button>

          {/* Clear Logs */}
          <button
            onClick={() => setLogs([])}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-red-400 transition-colors"
            title="Clear buffer"
          >
            <Trash2 size={12} />
          </button>

          {/* Expand / Collapse Height */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors hidden sm:block"
            title={isExpanded ? 'Collapse height' : 'Expand height'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={terminalScrollRef}
        className="flex-1 p-3.5 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed select-text bg-black scrollbar-none font-mono"
      >
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-neutral-600">
            No log entries match the current filter criteria.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 py-0.5 hover:bg-neutral-950 px-1 rounded transition-colors"
            >
              <span className="text-neutral-600 shrink-0 select-none">{log.timestamp}</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] border font-bold shrink-0 ${getLevelBadge(log.level)}`}>
                {log.level}
              </span>
              <span className="text-neutral-500 shrink-0">[{log.subsystem}]</span>
              <span className="text-neutral-300 break-all">{log.message}</span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Status Footer */}
      <div className="px-4 py-1.5 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500 shrink-0">
        <div className="flex items-center gap-3">
          <span>Buffer: {logs.length} lines</span>
          <span>&bull;</span>
          <span>Filtered: {filteredLogs.length} lines</span>
          <span>&bull;</span>
          <span className="text-neutral-400">Stream: cluster-ingress-daemon.service</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Encoding: UTF-8</span>
          <span>&bull;</span>
          <span className="text-emerald-400">Pipe: stdout/stderr</span>
        </div>
      </div>
    </div>
  );
}
