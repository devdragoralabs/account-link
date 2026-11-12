import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  ShieldCheck,
  Server,
  Database,
  Layers,
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Terminal,
  ArrowRight,
  Home,
  User,
  Shield,
  Key,
  Smartphone,
  Sliders,
  Network
} from 'lucide-react';
import { WavyBackground } from './components/WavyBackground';
import { ServiceManagePage, ServiceItem } from './components/ServiceManagePage';
import { AccountPage } from './components/AccountPage';
import { AdminControlPanel } from './components/AdminControlPanel';

type SectionType = 'home' | 'account' | 'admin';

// Home services list
const homeServices: ServiceItem[] = [
  {
    id: 'srv-1',
    name: 'api-gateway-edge',
    endpoint: '/api/v1/ingress',
    type: 'HTTP/2 Reverse Proxy',
    latency: '11ms',
    status: 'active',
    icon: Zap,
    protocol: 'HTTP/2 TLS 1.3',
    port: '443',
    throughput: '4,820 req/s',
    uptime: '99.99%',
    memory: '312 MB',
    description: 'Edge reverse proxy routing inbound traffic to internal microservice clusters with automated SSL termination and rate limiting.',
    logs: [
      '13:42:01.102 [INFO] SSL handshake completed for client 192.168.1.42 (TLS_AES_256_GCM_SHA384)',
      '13:42:01.218 [HTTP] GET /api/v1/ingress/health 200 OK - 1.2ms',
      '13:42:02.004 [DEBUG] Upstream keep-alive connection pool: 128 active sockets',
      '13:42:02.450 [METRICS] Ingress throughput peak: 5.1k req/s, 0 dropped frames'
    ]
  },
  {
    id: 'srv-2',
    name: 'cluster-db-replica',
    endpoint: 'db.internal:5432',
    type: 'PostgreSQL Read Pool',
    latency: '4ms',
    status: 'synced',
    icon: Database,
    protocol: 'Postgres wire protocol v3.0',
    port: '5432',
    throughput: '1,420 queries/s',
    uptime: '99.98%',
    memory: '2.4 GB',
    description: 'Synchronous read replica cluster for low-latency queries with automatic failover and WAL streaming replication.',
    logs: [
      '13:41:55.302 [WAL] Received sequence 0/14B20A8 from primary node db-master-01',
      '13:41:58.910 [POOL] 32/32 connections pooled, avg query execution time 3.4ms',
      '13:42:00.120 [CHECK] Replication lag: 0 bytes (0.00ms latency)',
      '13:42:01.884 [STAT] Buffer cache hit ratio: 99.4%'
    ]
  },
  {
    id: 'srv-3',
    name: 'redis-cache-cluster',
    endpoint: 'cache.internal:6379',
    type: 'In-Memory Key/Value',
    latency: '1ms',
    status: 'optimal',
    icon: Layers,
    protocol: 'RESP3 (Redis Serialization)',
    port: '6379',
    throughput: '12,900 ops/s',
    uptime: '100.00%',
    memory: '840 MB',
    description: 'Cluster-wide in-memory caching tier with LRU eviction policy and sub-millisecond key lookups.',
    logs: [
      '13:41:48.211 [INFO] Cluster state: OK, 3 master shards, 3 replica shards',
      '13:41:59.040 [SYNC] Background save completed: 1.4M keys in memory',
      '13:42:01.320 [EVICT] Eviction policy: volatile-lru, fragmentation ratio: 1.08',
      '13:42:02.115 [BENCH] P99 latency: 0.8ms across all cluster slots'
    ]
  },
  {
    id: 'srv-4',
    name: 'auth-session-worker',
    endpoint: '/oauth/token/verify',
    type: 'JWT / Session Broker',
    latency: '14ms',
    status: 'active',
    icon: Server,
    protocol: 'gRPC / JSON-RPC',
    port: '8088',
    throughput: '920 auth/s',
    uptime: '99.95%',
    memory: '185 MB',
    description: 'Cryptographic session validation service verifying asymmetric RSA-4096 and Ed25519 token signatures.',
    logs: [
      '13:41:50.001 [AUTH] Key rotation check: active key ID kid_2026_cluster_01 valid',
      '13:42:00.340 [TOKEN] Validated bearer token for sub=admin@cluster.local',
      '13:42:01.992 [PERM] Scope verified: cluster:admin, metrics:read, fleet:manage',
      '13:42:02.310 [AUDIT] Zero unauthorized authentication attempts in the last 15m'
    ]
  }
];

// Account tokens & credentials
const accountServices: ServiceItem[] = [];

// Admin infrastructure nodes
const adminServices: ServiceItem[] = [
  {
    id: 'adm-1',
    name: 'cluster-k8s-master-01',
    endpoint: '10.240.0.1:6443',
    type: 'Control Plane Node • Ready',
    latency: '2ms',
    status: 'active',
    icon: Server,
    protocol: 'k8s API HTTPS',
    port: '6443',
    throughput: 'etcd 3,100 writes/s',
    uptime: '99.99%',
    memory: '8.2 / 32 GB',
    description: 'Primary Kubernetes control plane node running API server, scheduler, and Raft consensus storage.',
    logs: [
      '13:41:50.100 [ETCD] Raft leader lease renewed with term 418',
      '13:42:00.220 [KUBE-SCHEDULER] 0 unassigned pods; all 16 worker nodes reporting Ready',
      '13:42:01.540 [API] GET /api/v1/nodes healthy - status 200 in 1.8ms',
      '13:42:02.100 [AUDIT] RBAC policy evaluator checked 84 permissions; 0 denials'
    ]
  },
  {
    id: 'adm-2',
    name: 'ingress-envoy-controller',
    endpoint: '10.240.1.10:443',
    type: 'BGP Edge Router • Anycast',
    latency: '1ms',
    status: 'optimal',
    icon: Zap,
    protocol: 'BGP / Envoy Proxy v1.29',
    port: '443 / 80',
    throughput: '18,500 conn/s',
    uptime: '100.00%',
    memory: '1.2 GB',
    description: 'Border Gateway Protocol (BGP) ingress router distributing external global network packets across nodes.',
    logs: [
      '13:41:40.000 [BGP] Peer AS64512 established; prefix 198.51.100.0/24 announced',
      '13:42:00.110 [ENVOY] Route table hash updated: 24 active cluster targets',
      '13:42:01.300 [DDOS] SYN flood protection enabled; current drop rate: 0.00%',
      '13:42:02.000 [HEALTH] Upstream clusters healthy: 24/24'
    ]
  },
  {
    id: 'adm-3',
    name: 'audit-log-pipeline',
    endpoint: 'kafka://audit.cluster:9092',
    type: 'Immutable Append-Only Log',
    latency: '5ms',
    status: 'synced',
    icon: Database,
    protocol: 'Kafka Binary Protocol',
    port: '9092',
    throughput: '8,400 msg/s',
    uptime: '99.99%',
    memory: '4.1 GB',
    description: 'Distributed cryptographic event stream recording audit events, administrative commands, and auth requests.',
    logs: [
      '13:41:30.000 [PARTITION] Topic audit.security.events ISR: [1, 2, 3]',
      '13:42:00.890 [PRODUCER] Committed offset 8192849 in partition #0',
      '13:42:01.210 [COMPLIANCE] Cryptographic SHA-256 seal verified on latest batch',
      '13:42:02.000 [RETENTION] Log retention policy: 365 days immutable WORM'
    ]
  }
];

const allServices: ServiceItem[] = [
  ...homeServices,
  ...accountServices,
  ...adminServices
];

export default function App() {
  const [managingService, setManagingService] = useState<ServiceItem | null>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/home/manage/')) {
        const sName = decodeURIComponent(p.replace('/home/manage/', ''));
        return allServices.find((s) => s.name === sName || s.id === sName) || null;
      }
    }
    return null;
  });

  const [activeSection, setActiveSection] = useState<SectionType>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/home/manage/')) {
        const sName = decodeURIComponent(p.replace('/home/manage/', ''));
        if (accountServices.some((s) => s.name === sName || s.id === sName)) return 'account';
        if (adminServices.some((s) => s.name === sName || s.id === sName)) return 'admin';
        return 'home';
      }
      if (p === '/home/account') return 'account';
      if (p === '/home/admin') return 'admin';
    }
    return 'home';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p.startsWith('/home');
    }
    return false;
  });

  // Login form state
  const [email, setEmail] = useState('admin@cluster.local');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // UI & Clipboard State
  const [copied, setCopied] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenBtn, setShowFullscreenBtn] = useState(false);
  const [isListMinimized, setIsListMinimized] = useState(false);
  const [isListClosed, setIsListClosed] = useState(false);

  // Compute current path based on authentication, active section, and active management page
  const getPathForSection = (section: SectionType) => {
    switch (section) {
      case 'account':
        return '/home/account';
      case 'admin':
        return '/home/admin';
      case 'home':
      default:
        return '/home/dashboard';
    }
  };

  const currentPath = !isAuthenticated
    ? '/auth/login'
    : managingService
    ? `/home/manage/${managingService.name}`
    : getPathForSection(activeSection);

  const navigateTo = (targetPath: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({}, '', targetPath);
      } catch (err) {
        console.warn('Unable to pushState:', err);
      }
    }
  };

  const handleSelectSection = (section: SectionType) => {
    setManagingService(null);
    setActiveSection(section);
    setIsAuthenticated(true);
    navigateTo(getPathForSection(section));
  };

  const handleOpenManagePage = (item: ServiceItem) => {
    setManagingService(item);
    setIsAuthenticated(true);
    navigateTo(`/home/manage/${item.name}`);
  };

  const handleBackFromManage = () => {
    setManagingService(null);
    navigateTo(getPathForSection(activeSection));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p.startsWith('/home/manage/')) {
        const sName = decodeURIComponent(p.replace('/home/manage/', ''));
        const match = allServices.find((s) => s.name === sName || s.id === sName);
        if (match) {
          setIsAuthenticated(true);
          setManagingService(match);
          if (accountServices.some((s) => s.name === sName || s.id === sName)) {
            setActiveSection('account');
          } else if (adminServices.some((s) => s.name === sName || s.id === sName)) {
            setActiveSection('admin');
          } else {
            setActiveSection('home');
          }
        }
      } else if (p === '/home/account') {
        setIsAuthenticated(true);
        setManagingService(null);
        setActiveSection('account');
      } else if (p === '/home/admin') {
        setIsAuthenticated(true);
        setManagingService(null);
        setActiveSection('admin');
      } else if (p === '/home/dashboard') {
        setIsAuthenticated(true);
        setManagingService(null);
        setActiveSection('home');
      } else if (p === '/auth/login') {
        setIsAuthenticated(false);
        setManagingService(null);
      } else {
        try {
          window.history.replaceState({}, '', '/auth/login');
        } catch {}
        setIsAuthenticated(false);
        setManagingService(null);
      }

      const handlePopState = () => {
        const cur = window.location.pathname;
        if (cur.startsWith('/home/manage/')) {
          const sName = decodeURIComponent(cur.replace('/home/manage/', ''));
          const match = allServices.find((s) => s.name === sName || s.id === sName);
          if (match) {
            setIsAuthenticated(true);
            setManagingService(match);
            if (accountServices.some((s) => s.name === sName || s.id === sName)) {
              setActiveSection('account');
            } else if (adminServices.some((s) => s.name === sName || s.id === sName)) {
              setActiveSection('admin');
            } else {
              setActiveSection('home');
            }
            return;
          }
        }
        setManagingService(null);
        if (cur === '/home/account') {
          setIsAuthenticated(true);
          setActiveSection('account');
        } else if (cur === '/home/admin') {
          setIsAuthenticated(true);
          setActiveSection('admin');
        } else if (cur === '/home/dashboard') {
          setIsAuthenticated(true);
          setActiveSection('home');
        } else {
          setIsAuthenticated(false);
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const currentServices =
    activeSection === 'account'
      ? accountServices
      : activeSection === 'admin'
      ? adminServices
      : homeServices;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.warn('Failed to copy text:', err);
    }
  };

  const handleCopyItem = async (endpoint: string, id: string) => {
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 1500);
    } catch (err) {
      console.warn('Failed to copy item:', err);
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsAuthenticated(true);
      setManagingService(null);
      setActiveSection('home');
      navigateTo('/home/dashboard');
    }, 450);
  };

  const handleLogout = () => {
    setManagingService(null);
    setIsAuthenticated(false);
    navigateTo('/auth/login');
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleActivity = () => {
      setShowFullscreenBtn(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowFullscreenBtn(false);
      }, 2500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      handleActivity();
      if (e.key === 'f' || e.key === 'F') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          toggleFullscreen();
        }
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleKeyDown);

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  return (
    <main
      className="relative min-h-screen w-full bg-black text-neutral-300 p-6 pb-14 overflow-x-hidden select-none"
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          !target.closest('button') &&
          !target.closest('input') &&
          !target.closest('textarea') &&
          !target.closest('.interactive-card')
        ) {
          toggleFullscreen();
        }
      }}
    >
      {/* 21st.dev Style Interactive Wavy Background with Click Ripples */}
      <WavyBackground />

      {/* Subtle floating tech grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-35" aria-hidden="true">
        <div className="absolute -inset-[50px] floating-tech-grid" />
      </div>

      {/* Top Section */}
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        {/* Home, Account, Admin cards placed to the side of /home/dashboard card with more space and larger size */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          {/* Path Card with icon-only copy button */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950/90 text-neutral-300 shadow-xl backdrop-blur-md">
            <span className="font-mono text-sm text-neutral-200 tracking-wide select-all font-medium">
              {currentPath}
            </span>
            <div className="h-4 w-px bg-neutral-800" />
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 transition-all active:scale-90"
              title={copied ? 'Copied!' : 'Copy path'}
              aria-label="Copy path to clipboard"
            >
              {copied ? (
                <Check size={16} className="text-emerald-400 transition-transform scale-110" />
              ) : (
                <Copy size={16} className="transition-colors" />
              )}
            </button>
          </div>

          <div className="h-5 w-px bg-neutral-800/80 hidden md:block" />

          {/* Home, Account, Admin Buttons - Bigger & More Spaced */}
          <div className="flex items-center gap-3">
            {/* Home Card */}
            <button
              type="button"
              onClick={() => handleSelectSection('home')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-mono transition-all backdrop-blur-md shadow-lg active:scale-95 ${
                isAuthenticated && !managingService && activeSection === 'home'
                  ? 'border-neutral-700 bg-neutral-900 text-white font-medium ring-1 ring-neutral-700'
                  : 'border-neutral-900 bg-neutral-950/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-800'
              }`}
              title="Home Dashboard"
            >
              <Home
                size={16}
                className={
                  isAuthenticated && !managingService && activeSection === 'home'
                    ? 'text-emerald-400'
                    : 'text-neutral-500'
                }
              />
              <span>Home</span>
            </button>

            {/* Account Card */}
            <button
              type="button"
              onClick={() => handleSelectSection('account')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-mono transition-all backdrop-blur-md active:scale-95 ${
                isAuthenticated && !managingService && activeSection === 'account'
                  ? 'border-neutral-600 bg-black text-white font-medium ring-1 ring-neutral-700'
                  : 'border-neutral-900 bg-black text-neutral-400 hover:text-white hover:border-neutral-800'
              }`}
              title="Account & Security"
            >
              <User
                size={16}
                className={
                  isAuthenticated && !managingService && activeSection === 'account'
                    ? 'text-white'
                    : 'text-neutral-500'
                }
              />
              <span>Account</span>
            </button>

            {/* Admin Card */}
            <button
              type="button"
              onClick={() => handleSelectSection('admin')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-mono transition-all backdrop-blur-md active:scale-95 ${
                isAuthenticated && !managingService && activeSection === 'admin'
                  ? 'border-neutral-600 bg-black text-white font-medium ring-1 ring-neutral-700'
                  : 'border-neutral-900 bg-black text-neutral-400 hover:text-white hover:border-neutral-800'
              }`}
              title="Admin & Cluster Controls"
            >
              <Shield
                size={16}
                className={
                  isAuthenticated && !managingService && activeSection === 'admin'
                    ? 'text-amber-400'
                    : 'text-neutral-500'
                }
              />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Right side controls: Sign Out / Switch view + Fullscreen */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-800/80 bg-neutral-950/80 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-sm font-mono transition-all backdrop-blur-sm"
              title="Sign Out to /auth/login"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectSection('home')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-800/80 bg-neutral-950/80 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-sm font-mono transition-all backdrop-blur-sm"
              title="Go to /home/dashboard"
            >
              <ArrowRight size={15} />
              <span className="hidden sm:inline">Go to Dashboard</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2.5 rounded-xl border border-neutral-800/80 bg-neutral-950/80 text-neutral-500 hover:text-white hover:border-neutral-700 transition-opacity duration-300 backdrop-blur-sm ${
              showFullscreenBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            title="Toggle Fullscreen (F)"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* VIEW 1: LOGIN PAGE */}
      {!isAuthenticated ? (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-900 bg-neutral-950/90 shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Mac Window Titlebar for the Login Card */}
            <div className="px-4 py-3 border-b border-neutral-900 flex items-center justify-between bg-neutral-950/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block" />
              </div>
              <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
                <Lock size={11} className="text-neutral-400" />
                <span>auth-terminal</span>
              </div>
            </div>

            {/* Login Form Body */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div className="space-y-1 mb-2">
                <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                  <Terminal size={16} className="text-emerald-400" />
                  Cluster Authentication
                </h1>
                <p className="text-xs text-neutral-500 font-mono">
                  Sign in to access /home/dashboard
                </p>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg border border-red-900/60 bg-red-950/30 text-red-400 text-xs font-mono">
                  {loginError}
                </div>
              )}

              {/* Email / Username field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  User ID / Email
                </label>
                <div className="relative flex items-center">
                  <Mail size={14} className="absolute left-3 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    placeholder="admin@cluster.local"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={14} className="absolute left-3 text-neutral-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl pl-9 pr-9 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 text-neutral-500 hover:text-neutral-300 p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 rounded-xl bg-neutral-100 hover:bg-white text-black font-medium text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="font-mono text-xs">Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>

              {/* Instant Access Button */}
              <button
                type="button"
                onClick={() => handleLogin()}
                className="w-full py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs font-mono transition-colors"
              >
                Instant Access &rarr;
              </button>

              <div className="pt-2 text-center text-[10px] font-mono text-neutral-600 flex items-center justify-center gap-1.5">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>Protected by TLS 1.3 & E2E Handshake</span>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* VIEW 2: AUTHENTICATED CONTENT */
        <div className="relative z-10 mt-8 space-y-5">
          {managingService ? (
            /* DEDICATED MANAGE PAGE FOR CLICKED SERVICE */
            <ServiceManagePage
              service={managingService}
              section={activeSection}
              onBack={handleBackFromManage}
              onUpdateStatus={(newStatus) => {
                setManagingService((prev) => (prev ? { ...prev, status: newStatus } : null));
              }}
            />
          ) : (
            /* MAIN DASHBOARD VIEW (Cards + Services List Bar) */
            <>
              {/* SECTION: HOME DASHBOARD */}
              {activeSection === 'home' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
                  {/* Card 1: Server Health */}
                  <div className="interactive-card group relative p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 hover:border-neutral-800 hover:bg-neutral-900/40 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                          <Activity size={16} />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-400">
                          Healthy
                        </span>
                      </div>
                      <h2 className="text-xs font-medium text-neutral-400">Server Health</h2>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-semibold tracking-tight text-white font-mono">
                          99.98%
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">uptime</span>
                      </div>
                    </div>

                    {/* Progress bar like memory card */}
                    <div className="mt-4 pt-3 border-t border-neutral-900">
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full w-[99.98%]" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Wifi size={12} className="text-neutral-400" /> Latency: 16ms
                        </span>
                        <span className="font-mono text-neutral-400">Node-01</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Compute & Memory */}
                  <div className="interactive-card group relative p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 hover:border-neutral-800 hover:bg-neutral-900/40 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                          <Cpu size={16} />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                          Normal
                        </span>
                      </div>
                      <h2 className="text-xs font-medium text-neutral-400">Compute & Load</h2>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-semibold tracking-tight text-white font-mono">
                          34.2%
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">load</span>
                      </div>
                    </div>

                    {/* Memory progress bar */}
                    <div className="mt-4 pt-3 border-t border-neutral-900">
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2">
                        <div className="bg-blue-400 h-1.5 rounded-full w-[34.2%]" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                        <span>RAM 4.1 / 16 GB</span>
                        <span>8 Cores</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Storage */}
                  <div className="interactive-card group relative p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 hover:border-neutral-800 hover:bg-neutral-900/40 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
                          <HardDrive size={16} />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                          Encrypted
                        </span>
                      </div>
                      <h2 className="text-xs font-medium text-neutral-400">Storage Volumes</h2>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-semibold tracking-tight text-white font-mono">
                          128.4 GB
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">/ 512 GB</span>
                      </div>
                    </div>

                    {/* Storage progress bar */}
                    <div className="mt-4 pt-3 border-t border-neutral-900">
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2">
                        <div className="bg-amber-400 h-1.5 rounded-full w-[25%]" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-emerald-500" /> SSD Raid 1
                        </span>
                        <span className="font-mono text-neutral-400">25% used</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Network Mesh */}
                  <div className="interactive-card group relative p-4 rounded-xl border border-neutral-900 bg-neutral-950/80 hover:border-neutral-800 hover:bg-neutral-900/40 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                          <Network size={16} />
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                          BBR v3
                        </span>
                      </div>
                      <h2 className="text-xs font-medium text-neutral-400">Mesh Throughput</h2>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-semibold tracking-tight text-white font-mono">
                          15.2 Gbps
                        </span>
                        <span className="text-[11px] text-neutral-500 font-mono">pacing</span>
                      </div>
                    </div>

                    {/* Network progress bar */}
                    <div className="mt-4 pt-3 border-t border-neutral-900">
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden mb-2">
                        <div className="bg-emerald-400 h-1.5 rounded-full w-[64%]" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Zap size={12} className="text-amber-400" /> 0 drops
                        </span>
                        <span className="font-mono text-neutral-400">WireGuard</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: ACCOUNT */}
              {activeSection === 'account' && (
                <div className="space-y-6">
                  <AccountPage />
                </div>
              )}
              {/* SECTION: ADMIN */}
              {activeSection === 'admin' && (
                <div className="space-y-6">
                  <AdminControlPanel />
                </div>
              )}

              {/* Down it: The List Bar with Mac Window Buttons */}
              {activeSection === 'home' && (!isListClosed ? (
                <div className="interactive-card rounded-xl border border-neutral-900 bg-neutral-950/80 shadow-2xl overflow-hidden backdrop-blur-sm transition-all duration-300">
                  {/* macOS Window Titlebar for the List Bar */}
                  <div className="px-4 py-3 border-b border-neutral-900 flex items-center justify-between bg-neutral-950/80">
                    <div className="flex items-center gap-3">
                      {/* Mac Window Traffic Light Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Close (Red) */}
                        <button
                          type="button"
                          onClick={() => setIsListClosed(true)}
                          className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:brightness-110 active:scale-90 transition-all flex items-center justify-center group"
                          title="Close list"
                          aria-label="Close list"
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black/70 leading-none">&times;</span>
                        </button>
                        {/* Minimize (Yellow) */}
                        <button
                          type="button"
                          onClick={() => setIsListMinimized((prev) => !prev)}
                          className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:brightness-110 active:scale-90 transition-all flex items-center justify-center group"
                          title={isListMinimized ? 'Expand list' : 'Collapse list'}
                          aria-label="Minimize list"
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[8px] font-bold text-black/70 leading-none">&minus;</span>
                        </button>
                        {/* Fullscreen / Maximize (Green) */}
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] hover:brightness-110 active:scale-90 transition-all flex items-center justify-center group"
                          title="Toggle Fullscreen"
                          aria-label="Toggle Fullscreen"
                        >
                          <span className="opacity-0 group-hover:opacity-100 text-[7px] font-bold text-black/70 leading-none">&#x2922;</span>
                        </button>
                      </div>

                      <div className="h-3 w-px bg-neutral-800" />

                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-mono font-medium text-neutral-300 tracking-wide uppercase">
                          Active Cluster Services
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                          {currentServices.length} online
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-neutral-500 hidden sm:block">
                      Click service to open manage page
                    </div>
                  </div>

                  {/* List Rows */}
                  {!isListMinimized && (
                    <div className="divide-y divide-neutral-900/80 animate-in fade-in duration-200">
                      {currentServices.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleOpenManagePage(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleOpenManagePage(item);
                              }
                            }}
                            className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none group transition-all hover:bg-neutral-900/30 border-l-2 border-transparent hover:border-emerald-500/80"
                          >
                            {/* Left: Icon & Name */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-emerald-400 group-hover:border-neutral-700 transition-colors flex-shrink-0">
                                <Icon size={14} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
                                    &bull; {item.type}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-neutral-500 block truncate">
                                  {item.endpoint}
                                </span>
                              </div>
                            </div>

                            {/* Right: Latency, Status & Direct Manage Button */}
                            <div className="flex items-center gap-3.5 self-end sm:self-center flex-shrink-0">
                              <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5">
                                <span className="text-neutral-600">status:</span>
                                <span className="text-emerald-400 font-medium">{item.latency}</span>
                              </div>

                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="capitalize">{item.status}</span>
                              </div>

                              {/* Copy button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyItem(item.endpoint, item.id);
                                }}
                                className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                                title={`Copy ${item.endpoint}`}
                                aria-label="Copy endpoint"
                              >
                                {copiedItem === item.id ? (
                                  <Check size={13} className="text-emerald-400" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>

                              {/* Dedicated Manage Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenManagePage(item);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white transition-all active:scale-95 group/btn shadow-sm"
                                title={`Open dedicated management page for ${item.name}`}
                              >
                                <span>Manage</span>
                                <ArrowRight
                                  size={12}
                                  className="text-neutral-500 group-hover/btn:text-emerald-400 group-hover/btn:translate-x-0.5 transition-transform"
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center py-2">
                  <button
                    type="button"
                    onClick={() => setIsListClosed(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-mono text-neutral-400 hover:text-white transition-all flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                    Restore List Bar
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </main>
  );
}
