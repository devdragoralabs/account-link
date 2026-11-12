import React, { useState, useEffect, useRef } from 'react';
import {
  Server,
  Network,
  Cpu,
  Shield,
  Plus,
  RotateCcw,
  Globe,
  HardDrive,
  Activity,
  AlertOctagon,
  Sliders,
  Lock,
  RefreshCw,
  Key,
  Download,
  Check,
  CheckCircle2,
  Terminal,
  Zap,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit2,
  Mail,
  Smartphone,
  Eye,
  Filter,
  Search,
  MoreVertical,
  Archive,
  Database,
  CloudRain,
  Play,
  ArrowRight,
  Send,
  Layers,
  Radio,
  Wifi,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  ExternalLink,
  Cloud,
  Sparkles
} from 'lucide-react';
import { SystemLogsTerminal } from './SystemLogsTerminal';

export interface ClusterNodeItem {
  id: string;
  name: string;
  role: 'Control Plane' | 'Worker Edge' | 'Storage Volume' | 'Ingress Proxy';
  status: 'online' | 'draining' | 'restarting';
  ipv4: string;
  ipv6: string;
  cpuPercent: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  diskPercent: number;
  uptime: string;
  region: string;
}

export interface NetworkConfigData {
  hostname: string;
  primaryInterface: string;
  customIpv4: string;
  ipv4SubnetMask: string;
  ipv4Gateway: string;
  customIpv6: string;
  ipv6Prefix: string;
  ipv6Gateway: string;
  primaryDns: string;
  secondaryDns: string;
  mtu: number;
  ipForwarding: boolean;
  bbrCongestionControl: boolean;
}

export interface ClusterUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  twoFactor: boolean;
  lastLogin: string;
  sessionsCount: number;
}

export interface ClusterRole {
  id: string;
  name: string;
  level: string;
  description: string;
  userCount: number;
  permissions: {
    clusterMesh: boolean;
    nodeDrain: boolean;
    secretsVault: boolean;
    networkRouting: boolean;
    terminalPty: boolean;
    userManagement: boolean;
  };
}

export interface FirewallRuleItem {
  id: string;
  priority: number;
  direction: 'IN' | 'OUT';
  protocol: 'TCP' | 'UDP' | 'ICMP';
  port: string;
  cidr: string;
  target: string;
  action: 'ACCEPT' | 'DROP' | 'REJECT';
  enabled: boolean;
  hits: number;
  comment: string;
}

export interface StorageVolumeItem {
  id: string;
  name: string;
  sizeGB: number;
  filesystem: 'ZFS' | 'ext4' | 'XFS';
  nodeMount: string;
  mountPath: string;
  encrypted: boolean;
  health: 'optimal' | 'syncing' | 'degraded';
  iops: number;
}

export interface ClusterSnapshotItem {
  id: string;
  timestamp: string;
  name: string;
  size: string;
  checksum: string;
  type: 'automated' | 'manual';
  s3Replicated: boolean;
  status: 'verified' | 'in-progress';
}

const DEFAULT_NODES: ClusterNodeItem[] = [
  {
    id: 'node-1',
    name: 'control-plane-primary',
    role: 'Control Plane',
    status: 'online',
    ipv4: '10.240.0.11',
    ipv6: '2600:1f18::11',
    cpuPercent: 24,
    memoryUsedGB: 7.8,
    memoryTotalGB: 32,
    diskPercent: 41,
    uptime: '42d 11h',
    region: 'us-east-1a'
  },
  {
    id: 'node-2',
    name: 'ingress-edge-router-01',
    role: 'Ingress Proxy',
    status: 'online',
    ipv4: '10.240.0.12',
    ipv6: '2600:1f18::12',
    cpuPercent: 38,
    memoryUsedGB: 12.2,
    memoryTotalGB: 32,
    diskPercent: 29,
    uptime: '18d 04h',
    region: 'us-east-1b'
  },
  {
    id: 'node-3',
    name: 'worker-compute-fleet-a',
    role: 'Worker Edge',
    status: 'online',
    ipv4: '10.240.0.13',
    ipv6: '2600:1f18::13',
    cpuPercent: 62,
    memoryUsedGB: 28.4,
    memoryTotalGB: 64,
    diskPercent: 54,
    uptime: '30d 19h',
    region: 'us-east-1c'
  },
  {
    id: 'node-4',
    name: 'storage-nvme-mesh-01',
    role: 'Storage Volume',
    status: 'online',
    ipv4: '10.240.0.14',
    ipv6: '2600:1f18::14',
    cpuPercent: 18,
    memoryUsedGB: 16.1,
    memoryTotalGB: 64,
    diskPercent: 68,
    uptime: '77d 02h',
    region: 'us-east-1a'
  }
];

const DEFAULT_NETWORK_CONFIG: NetworkConfigData = {
  hostname: 'cluster-mesh.core.internal',
  primaryInterface: 'eth0',
  customIpv4: '192.168.1.150',
  ipv4SubnetMask: '255.255.255.0',
  ipv4Gateway: '192.168.1.1',
  customIpv6: '2600:1f18:6320:8000::150',
  ipv6Prefix: '64',
  ipv6Gateway: 'fe80::1',
  primaryDns: '1.1.1.1',
  secondaryDns: '8.8.8.8',
  mtu: 1500,
  ipForwarding: true,
  bbrCongestionControl: true
};

const DEFAULT_USERS: ClusterUser[] = [
  {
    id: 'usr-1',
    name: 'Alex Mercer',
    email: 'admin@cluster.local',
    role: 'Superadmin',
    status: 'active',
    twoFactor: true,
    lastLogin: 'Active now',
    sessionsCount: 3
  },
  {
    id: 'usr-2',
    name: 'Elena Rostova',
    email: 'e.rostova@cluster.local',
    role: 'Security Officer',
    status: 'active',
    twoFactor: true,
    lastLogin: '18 minutes ago',
    sessionsCount: 1
  },
  {
    id: 'usr-3',
    name: 'Jordan Vance',
    email: 'j.vance@cluster.local',
    role: 'DevOps Operator',
    status: 'active',
    twoFactor: true,
    lastLogin: '2 hours ago',
    sessionsCount: 2
  },
  {
    id: 'usr-4',
    name: 'Marcus Brody',
    email: 'm.brody@cluster.local',
    role: 'Observability Viewer',
    status: 'active',
    twoFactor: false,
    lastLogin: 'Yesterday, 16:40',
    sessionsCount: 1
  },
  {
    id: 'usr-5',
    name: 'Tanya Chen',
    email: 't.chen@cluster.local',
    role: 'DevOps Operator',
    status: 'suspended',
    twoFactor: true,
    lastLogin: '14 days ago',
    sessionsCount: 0
  }
];

const DEFAULT_ROLES: ClusterRole[] = [
  {
    id: 'role-1',
    name: 'Superadmin',
    level: 'Tier 5 (Cluster Root)',
    description: 'Full unconstrained capability across all control nodes, secrets, network routing, and user lifecycles.',
    userCount: 1,
    permissions: {
      clusterMesh: true,
      nodeDrain: true,
      secretsVault: true,
      networkRouting: true,
      terminalPty: true,
      userManagement: true
    }
  },
  {
    id: 'role-2',
    name: 'Security Officer',
    level: 'Tier 4 (Governance)',
    description: 'Cryptographic audit authority, TLS/mTLS certificate issuance, 2FA enforcement, and access revocation.',
    userCount: 1,
    permissions: {
      clusterMesh: true,
      nodeDrain: false,
      secretsVault: true,
      networkRouting: false,
      terminalPty: false,
      userManagement: true
    }
  },
  {
    id: 'role-3',
    name: 'DevOps Operator',
    level: 'Tier 3 (Infrastructure)',
    description: 'Day-to-day cluster orchestration, pod deployments, node maintenance drain, and networking telemetry.',
    userCount: 2,
    permissions: {
      clusterMesh: true,
      nodeDrain: true,
      secretsVault: false,
      networkRouting: true,
      terminalPty: true,
      userManagement: false
    }
  },
  {
    id: 'role-4',
    name: 'Observability Viewer',
    level: 'Tier 1 (Read-Only)',
    description: 'Read-only access to Prometheus metrics, distributed traces, system logs, and hardware telemetry.',
    userCount: 1,
    permissions: {
      clusterMesh: true,
      nodeDrain: false,
      secretsVault: false,
      networkRouting: false,
      terminalPty: false,
      userManagement: false
    }
  }
];

const DEFAULT_FIREWALL_RULES: FirewallRuleItem[] = [
  {
    id: 'fw-1',
    priority: 10,
    direction: 'IN',
    protocol: 'TCP',
    port: '443, 80',
    cidr: '0.0.0.0/0',
    target: 'ingress-edge-router-01',
    action: 'ACCEPT',
    enabled: true,
    hits: 1420918,
    comment: 'Public HTTPS/HTTP ingress gateway'
  },
  {
    id: 'fw-2',
    priority: 20,
    direction: 'IN',
    protocol: 'TCP',
    port: '6443',
    cidr: '10.240.0.0/16',
    target: 'control-plane-primary',
    action: 'ACCEPT',
    enabled: true,
    hits: 842100,
    comment: 'Kubernetes control plane API server'
  },
  {
    id: 'fw-3',
    priority: 30,
    direction: 'IN',
    protocol: 'TCP',
    port: '22022',
    cidr: '192.168.1.0/24',
    target: 'All Nodes',
    action: 'ACCEPT',
    enabled: true,
    hits: 42910,
    comment: 'Internal Bastion SSH admin port'
  },
  {
    id: 'fw-4',
    priority: 40,
    direction: 'IN',
    protocol: 'TCP',
    port: '5432',
    cidr: '0.0.0.0/0',
    target: 'cluster-db-replica',
    action: 'DROP',
    enabled: true,
    hits: 18340,
    comment: 'Block unauthorized external DB queries'
  },
  {
    id: 'fw-5',
    priority: 50,
    direction: 'IN',
    protocol: 'ICMP',
    port: 'Echo',
    cidr: '0.0.0.0/0',
    target: 'All Nodes',
    action: 'ACCEPT',
    enabled: true,
    hits: 310480,
    comment: 'ICMP ping responsiveness'
  },
  {
    id: 'fw-6',
    priority: 60,
    direction: 'IN',
    protocol: 'UDP',
    port: '51820',
    cidr: '0.0.0.0/0',
    target: 'All Nodes',
    action: 'ACCEPT',
    enabled: true,
    hits: 980240,
    comment: 'WireGuard inter-node mesh tunnel'
  }
];

const DEFAULT_STORAGE_VOLUMES: StorageVolumeItem[] = [
  {
    id: 'vol-1',
    name: 'pvc-postgresql-wal',
    sizeGB: 500,
    filesystem: 'ZFS',
    nodeMount: 'control-plane-primary',
    mountPath: '/var/lib/postgresql/wal',
    encrypted: true,
    health: 'optimal',
    iops: 42000
  },
  {
    id: 'vol-2',
    name: 'pvc-redis-cache-fast',
    sizeGB: 120,
    filesystem: 'ZFS',
    nodeMount: 'worker-compute-fleet-a',
    mountPath: '/data/redis',
    encrypted: true,
    health: 'optimal',
    iops: 180000
  },
  {
    id: 'vol-3',
    name: 'pvc-audit-immutable-worm',
    sizeGB: 2048,
    filesystem: 'ext4',
    nodeMount: 'storage-nvme-mesh-01',
    mountPath: '/mnt/audit-logs',
    encrypted: true,
    health: 'optimal',
    iops: 24000
  },
  {
    id: 'vol-4',
    name: 'pvc-cluster-artifacts',
    sizeGB: 1024,
    filesystem: 'XFS',
    nodeMount: 'ingress-edge-router-01',
    mountPath: '/mnt/shared-builds',
    encrypted: true,
    health: 'optimal',
    iops: 35000
  }
];

const DEFAULT_SNAPSHOTS: ClusterSnapshotItem[] = [
  {
    id: 'snap-1',
    timestamp: '2026-11-10 02:00:00 UTC',
    name: 'snapshot-cluster-mesh-20261110-0200',
    size: '14.8 GB',
    checksum: 'sha256:8f92a10b...3d4e',
    type: 'automated',
    s3Replicated: true,
    status: 'verified'
  },
  {
    id: 'snap-2',
    timestamp: '2026-11-09 02:00:00 UTC',
    name: 'snapshot-cluster-mesh-20261109-0200',
    size: '14.6 GB',
    checksum: 'sha256:4a10c9e2...7f8a',
    type: 'automated',
    s3Replicated: true,
    status: 'verified'
  },
  {
    id: 'snap-3',
    timestamp: '2026-11-08 19:42:10 UTC',
    name: 'snapshot-pre-kernel-upgrade-manual',
    size: '14.5 GB',
    checksum: 'sha256:91b2c4d8...001e',
    type: 'manual',
    s3Replicated: true,
    status: 'verified'
  }
];

export function AdminControlPanel() {
  const [nodes, setNodes] = useState<ClusterNodeItem[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_admin_nodes');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_NODES;
  });

  const [networkConfig, setNetworkConfig] = useState<NetworkConfigData>(() => {
    try {
      const saved = localStorage.getItem('cluster_admin_network_config');
      if (saved) return { ...DEFAULT_NETWORK_CONFIG, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_NETWORK_CONFIG;
  });

  const [users, setUsers] = useState<ClusterUser[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_admin_users');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  });

  const [roles, setRoles] = useState<ClusterRole[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_admin_roles');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_ROLES;
  });

  const [firewallRules, setFirewallRules] = useState<FirewallRuleItem[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_admin_firewall');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_FIREWALL_RULES;
  });

  const [storageVolumes, setStorageVolumes] = useState<StorageVolumeItem[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_admin_storage');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_STORAGE_VOLUMES;
  });

  const [snapshots, setSnapshots] = useState<ClusterSnapshotItem[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_admin_snapshots');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SNAPSHOTS;
  });

  const [adminTab, setAdminTab] = useState<
    'users' | 'roles' | 'nodes' | 'network' | 'firewall' | 'storage' | 'backups' | 'console' | 'system' | 'governance'
  >('users');

  const [adminLockdown, setAdminLockdown] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [strictTLS, setStrictTLS] = useState(true);
  const [rateLimit, setRateLimit] = useState(5000);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global firewall shields
  const [synFloodShield, setSynFloodShield] = useState(true);
  const [geoIpFiltering, setGeoIpFiltering] = useState(true);
  const [portScanDrop, setPortScanDrop] = useState(true);

  // Users Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Modals state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('DevOps Operator');
  const [newUserRequire2FA, setNewUserRequire2FA] = useState(true);

  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLevel, setNewRoleLevel] = useState('Tier 2 (Custom Operator)');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeRole, setNewNodeRole] = useState<'Control Plane' | 'Worker Edge' | 'Storage Volume' | 'Ingress Proxy'>('Worker Edge');
  const [newNodeIpv4, setNewNodeIpv4] = useState('');
  const [newNodeIpv6, setNewNodeIpv6] = useState('');

  const [showAddFwRule, setShowAddFwRule] = useState(false);
  const [newFwPriority, setNewFwPriority] = useState(70);
  const [newFwDirection, setNewFwDirection] = useState<'IN' | 'OUT'>('IN');
  const [newFwProtocol, setNewFwProtocol] = useState<'TCP' | 'UDP' | 'ICMP'>('TCP');
  const [newFwPort, setNewFwPort] = useState('8080');
  const [newFwCidr, setNewFwCidr] = useState('0.0.0.0/0');
  const [newFwTarget, setNewFwTarget] = useState('All Nodes');
  const [newFwAction, setNewFwAction] = useState<'ACCEPT' | 'DROP' | 'REJECT'>('ACCEPT');
  const [newFwComment, setNewFwComment] = useState('Custom ingress rule');

  const [showCreateVolume, setShowCreateVolume] = useState(false);
  const [newVolName, setNewVolName] = useState('');
  const [newVolSize, setNewVolSize] = useState(250);
  const [newVolFs, setNewVolFs] = useState<'ZFS' | 'ext4' | 'XFS'>('ZFS');
  const [newVolMount, setNewVolMount] = useState('control-plane-primary');
  const [newVolPath, setNewVolPath] = useState('/mnt/data/new-volume');

  // VPS Real Linux Shell State
  const [gcpProject, setGcpProject] = useState('vps-debian-node-01');
  const [gcpAccount, setGcpAccount] = useState('root');
  const [gcpZone, setGcpZone] = useState('us-central1-a');
  const [isCloudShellBoosted, setIsCloudShellBoosted] = useState(false);
  const [cloudShellStatus, setCloudShellStatus] = useState<'connected' | 'restarting'>('connected');
  const [cliInput, setCliInput] = useState('');
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [cliHistory, setCliHistory] = useState<string[]>([]);
  const [cliHistoryIndex, setCliHistoryIndex] = useState<number>(-1);
  const [cliLines, setCliLines] = useState<Array<{ text: string; type: 'cmd' | 'out' | 'err' | 'info' | 'gcp' }>>([
    { text: 'Debian GNU/Linux 12 (bookworm) VPS Node (kernel 6.6.x x86_64)', type: 'gcp' },
    { text: 'Active Root Shell - Real container execution environment (/usr/sbin/service, /usr/bin/apt)', type: 'info' },
    { text: 'Persistent filesystem mounted at /app/applet with full root capabilities.', type: 'info' },
    { text: 'Native services supported: "service nginx status", "service --status-all", "apt list --installed | head -n 15", "apt --version"', type: 'info' },
    { text: 'Type any Linux command below to execute directly on the live VPS container.', type: 'gcp' }
  ]);
  const cliScrollRef = useRef<HTMLDivElement>(null);

  // Snapshot creation progress state
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  // Admin Sub-Tabs Scrolling & Layout State
  const [wrapAdminTabs, setWrapAdminTabs] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStartX, setScrollStartX] = useState(0);
  const adminTabsRef = useRef<HTMLDivElement>(null);

  const checkTabsScrollable = () => {
    if (adminTabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = adminTabsRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (adminTabsRef.current && !wrapAdminTabs) {
      // Map vertical mouse wheel movement to horizontal scrolling
      if (e.deltaY !== 0) {
        adminTabsRef.current.scrollLeft += e.deltaY;
        checkTabsScrollable();
      } else if (e.deltaX !== 0) {
        adminTabsRef.current.scrollLeft += e.deltaX;
        checkTabsScrollable();
      }
    }
  };

  const handleMouseDownTabs = (e: React.MouseEvent) => {
    if (wrapAdminTabs || !adminTabsRef.current) return;
    setIsDraggingTabs(true);
    setDragStartX(e.pageX - adminTabsRef.current.offsetLeft);
    setScrollStartX(adminTabsRef.current.scrollLeft);
  };

  const handleMouseMoveTabs = (e: React.MouseEvent) => {
    if (!isDraggingTabs || !adminTabsRef.current || wrapAdminTabs) return;
    e.preventDefault();
    const x = e.pageX - adminTabsRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    adminTabsRef.current.scrollLeft = scrollStartX - walk;
    checkTabsScrollable();
  };

  const handleMouseUpOrLeaveTabs = () => {
    setIsDraggingTabs(false);
    checkTabsScrollable();
  };

  const scrollAdminTabsBy = (direction: 'left' | 'right') => {
    if (adminTabsRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      adminTabsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkTabsScrollable, 350);
    }
  };

  useEffect(() => {
    checkTabsScrollable();
    const handleResize = () => checkTabsScrollable();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [wrapAdminTabs, nodes.length, users.length, roles.length, firewallRules.length, storageVolumes.length, snapshots.length]);

  useEffect(() => {
    localStorage.setItem('cluster_admin_nodes', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('cluster_admin_network_config', JSON.stringify(networkConfig));
  }, [networkConfig]);

  useEffect(() => {
    localStorage.setItem('cluster_admin_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('cluster_admin_roles', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('cluster_admin_firewall', JSON.stringify(firewallRules));
  }, [firewallRules]);

  useEffect(() => {
    localStorage.setItem('cluster_admin_storage', JSON.stringify(storageVolumes));
  }, [storageVolumes]);

  useEffect(() => {
    localStorage.setItem('cluster_admin_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  // Periodic simulated packet hit counter
  useEffect(() => {
    const timer = setInterval(() => {
      setFirewallRules(prev =>
        prev.map(rule =>
          rule.enabled
            ? { ...rule, hits: rule.hits + Math.floor(Math.random() * 8) + 1 }
            : rule
        )
      );
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // User Actions
  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        if (u.email === 'admin@cluster.local') {
          showFeedback('Root superadmin account status is locked.');
          return u;
        }
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        showFeedback(`User ${u.name} status updated to ${nextStatus}.`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleChangeUserRole = (userId: string, newRole: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        showFeedback(`Updated role for ${u.name} to ${newRole}.`);
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (target.email === 'admin@cluster.local') {
      showFeedback('Cannot delete primary root superadmin account.');
      return;
    }
    if (window.confirm(`Delete user ${target.name} (${target.email}) permanently?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      showFeedback(`User ${target.name} deleted.`);
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const newUser: ClusterUser = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      status: 'active',
      twoFactor: newUserRequire2FA,
      lastLogin: 'Never',
      sessionsCount: 0
    };
    setUsers(prev => [...prev, newUser]);
    setShowAddUser(false);
    setNewUserName('');
    setNewUserEmail('');
    showFeedback(`User ${newUser.name} created and credentials issued.`);
  };

  // Create Role Submit
  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const newRole: ClusterRole = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      level: newRoleLevel.trim() || 'Tier 2 (Custom)',
      description: newRoleDescription.trim() || 'Custom policy set for specialized operators.',
      userCount: 0,
      permissions: {
        clusterMesh: true,
        nodeDrain: false,
        secretsVault: false,
        networkRouting: false,
        terminalPty: true,
        userManagement: false
      }
    };
    setRoles(prev => [...prev, newRole]);
    setShowCreateRole(false);
    setNewRoleName('');
    setNewRoleDescription('');
    showFeedback(`Custom role ${newRole.name} established.`);
  };

  // Node Actions
  const handleToggleNodeDrain = (nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextStatus = n.status === 'draining' ? 'online' : 'draining';
        showFeedback(`Node ${n.name} status updated: ${nextStatus}.`);
        return { ...n, status: nextStatus };
      }
      return n;
    }));
  };

  const handleRebootNode = (nodeId: string) => {
    setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, status: 'restarting' } : n)));
    showFeedback('Executing node reboot sequence with soft kernel sync...');
    setTimeout(() => {
      setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, status: 'online' } : n)));
      showFeedback('Node reboot completed. Node re-joined cluster mesh.');
    }, 2800);
  };

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const nextIdNumber = nodes.length + 1;
    const newNode: ClusterNodeItem = {
      id: `node-${Date.now()}`,
      name: newNodeName.trim(),
      role: newNodeRole,
      status: 'online',
      ipv4: newNodeIpv4.trim() || `10.240.0.${nextIdNumber + 10}`,
      ipv6: newNodeIpv6.trim() || `2600:1f18::${nextIdNumber + 10}`,
      cpuPercent: Math.floor(Math.random() * 25) + 10,
      memoryUsedGB: 6.4,
      memoryTotalGB: 32,
      diskPercent: 22,
      uptime: '1m',
      region: 'us-east-1a'
    };

    setNodes(prev => [...prev, newNode]);
    setShowAddNode(false);
    setNewNodeName('');
    setNewNodeIpv4('');
    setNewNodeIpv6('');
    showFeedback(`Node ${newNode.name} added to cluster mesh.`);
  };

  // Firewall Rule Actions
  const handleAddFwRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: FirewallRuleItem = {
      id: `fw-${Date.now()}`,
      priority: Number(newFwPriority),
      direction: newFwDirection,
      protocol: newFwProtocol,
      port: newFwPort.trim() || 'Any',
      cidr: newFwCidr.trim() || '0.0.0.0/0',
      target: newFwTarget,
      action: newFwAction,
      enabled: true,
      hits: 0,
      comment: newFwComment.trim() || 'Custom rule'
    };
    setFirewallRules(prev => [...prev, newRule].sort((a, b) => a.priority - b.priority));
    setShowAddFwRule(false);
    showFeedback(`Firewall rule #${newRule.priority} applied to netfilter eBPF table.`);
  };

  const handleToggleFwRule = (ruleId: string) => {
    setFirewallRules(prev => prev.map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)));
    showFeedback('Rule policy toggled.');
  };

  const handleDeleteFwRule = (ruleId: string) => {
    setFirewallRules(prev => prev.filter(r => r.id !== ruleId));
    showFeedback('Firewall rule removed.');
  };

  // Storage Volume Actions
  const handleAddVolumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolName.trim()) return;
    const newVol: StorageVolumeItem = {
      id: `vol-${Date.now()}`,
      name: newVolName.trim(),
      sizeGB: Number(newVolSize),
      filesystem: newVolFs,
      nodeMount: newVolMount,
      mountPath: newVolPath.trim() || '/mnt/storage',
      encrypted: true,
      health: 'optimal',
      iops: 50000
    };
    setStorageVolumes(prev => [...prev, newVol]);
    setShowCreateVolume(false);
    setNewVolName('');
    showFeedback(`Storage volume ${newVol.name} provisioned & formatted with ${newVol.filesystem}.`);
  };

  const handleRunTrim = () => {
    showFeedback('Issuing NVMe TRIM discard across all storage pools...');
    setTimeout(() => {
      showFeedback('TRIM complete: 1.4 TB deallocated unmapped LBAs freed.');
    }, 1500);
  };

  // Snapshot Actions
  const handleCreateSnapshot = () => {
    setIsCreatingSnapshot(true);
    showFeedback('Initiating ZFS block snapshot with cryptographic SHA-256 seal...');
    setTimeout(() => {
      const now = new Date();
      const newSnap: ClusterSnapshotItem = {
        id: `snap-${Date.now()}`,
        timestamp: now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        name: `snapshot-manual-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`,
        size: '14.9 GB',
        checksum: `sha256:${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        type: 'manual',
        s3Replicated: true,
        status: 'verified'
      };
      setSnapshots(prev => [newSnap, ...prev]);
      setIsCreatingSnapshot(false);
      showFeedback(`Snapshot ${newSnap.name} created and verified.`);
    }, 2000);
  };

  // Real VPS Linux Terminal Interpreter (Debian container with apt & service)
  const handleCliSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cliInput.trim();
    if (!cmd || isExecutingCmd) return;

    setCliHistory(prev => [...prev, cmd]);
    setCliHistoryIndex(-1);
    setCliLines(prev => [
      ...prev,
      { text: `root@vps-debian:~# ${cmd}`, type: "cmd" }
    ]);
    setCliInput("");

    if (cmd === "clear") {
      setCliLines([]);
      return;
    }

    if (cmd === "help") {
      setCliLines(prev => [
        ...prev,
        { text: "Debian 12 VPS Terminal - Real Linux Command Reference:", type: "gcp" },
        { text: "  service <name> status/restart/start/stop - Manage Linux daemons (e.g. service nginx status)", type: "out" },
        { text: "  service --status-all                     - List all installed Linux system services", type: "out" },
        { text: "  apt --version                            - Show Debian package manager version", type: "out" },
        { text: "  apt list --installed                     - List installed Debian packages (pipe with head)", type: "out" },
        { text: "  apt-cache search <query>                 - Search available package repositories", type: "out" },
        { text: "  cat /etc/os-release                      - Show Debian GNU/Linux OS distribution info", type: "out" },
        { text: "  uname -a                                 - View system kernel and architecture specs", type: "out" },
        { text: "  ps aux / top                             - Display active Linux container processes", type: "out" },
        { text: "  ip a / ifconfig                          - Show network interfaces and assigned IPs", type: "out" },
        { text: "  df -h                                    - Disk and filesystem volume metrics", type: "out" },
        { text: "  free -m                                  - Display live RAM and swap allocation", type: "out" },
        { text: "  uptime                                   - System uptime and current load averages", type: "out" },
        { text: "  nodes                                    - Display mesh cluster node telemetry", type: "out" },
        { text: "  clear                                    - Clear the terminal screen buffer", type: "out" }
      ]);
      setTimeout(() => {
        if (cliScrollRef.current) cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
      }, 50);
      return;
    }

    if (cmd === "nodes") {
      setCliLines(prev => [
        ...prev,
        { text: "NAME                     ROLE            STATUS   IPV4         CPU%  RAM (GB)", type: "info" },
        ...nodes.map(n => ({
          text: `${n.name.padEnd(24)} ${n.role.padEnd(15)} ${n.status.padEnd(8)} ${n.ipv4.padEnd(12)} ${String(n.cpuPercent).padEnd(5)}% ${n.memoryUsedGB}/${n.memoryTotalGB}`,
          type: "out" as const
        }))
      ]);
      setTimeout(() => {
        if (cliScrollRef.current) cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
      }, 50);
      return;
    }

    setIsExecutingCmd(true);

    try {
      const response = await fetch("/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const stdout: string = data.stdout || "";
      const stderr: string = data.stderr || "";

      const newLines: Array<{ text: string; type: "cmd" | "out" | "err" | "info" | "gcp" }> = [];

      if (stdout) {
        const lines = stdout.split("\n");
        if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
        lines.forEach((l: string) => {
          newLines.push({ text: l, type: "out" });
        });
      }

      if (stderr) {
        const lines = stderr.split("\n");
        if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
        lines.forEach((l: string) => {
          newLines.push({ text: l, type: "err" });
        });
      }

      if (!stdout && !stderr) {
        newLines.push({ text: `[Command completed with exit code ${data.exitCode}]`, type: "info" });
      } else if (data.exitCode !== 0) {
        newLines.push({ text: `[Process exited with non-zero exit code: ${data.exitCode}]`, type: "err" });
      }

      setCliLines(prev => [...prev, ...newLines]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown execution failure";
      setCliLines(prev => [
        ...prev,
        { text: `vps-terminal: failed to execute: ${message}`, type: "err" }
      ]);
    } finally {
      setIsExecutingCmd(false);
      setTimeout(() => {
        if (cliScrollRef.current) {
          cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Cluster Status Header */}
      <div className="p-5 rounded-xl border border-neutral-900 bg-black flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Shield className="text-amber-400" size={18} />
              Cluster Administration & Infrastructure Fleet
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-300">
              Clearance Level 5
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-300">
              All Systems Nominal
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-500">
            <span>Primary Host: <span className="text-neutral-300">{networkConfig.hostname}</span></span>
            <span>&bull;</span>
            <span className="text-neutral-400">IPv4 VIP: <span className="text-white font-medium">{networkConfig.customIpv4}</span></span>
            <span>&bull;</span>
            <span className="text-neutral-400">Nodes: <span className="text-white font-medium">{nodes.length} Online</span></span>
            <span>&bull;</span>
            <span className="text-neutral-400">Storage: <span className="text-white font-medium">32.0 TB NVMe</span></span>
            {adminLockdown && (
              <>
                <span>&bull;</span>
                <span className="text-red-400 flex items-center gap-1 font-bold">
                  <AlertOctagon size={13} /> LOCKDOWN ACTIVE
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto border-t md:border-t-0 border-neutral-900 pt-3 md:pt-0">
          <div className="px-3 py-1.5 rounded-lg bg-black border border-neutral-900 text-center">
            <div className="text-[10px] text-neutral-600 uppercase">Users</div>
            <div className="text-sm font-semibold text-white">{users.filter(u => u.status === 'active').length} Active</div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-black border border-neutral-900 text-center">
            <div className="text-[10px] text-neutral-600 uppercase">Firewall</div>
            <div className="text-sm font-semibold text-emerald-400">{firewallRules.filter(r => r.enabled).length} Rules</div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-black border border-neutral-900 text-center">
            <div className="text-[10px] text-neutral-600 uppercase">Snapshots</div>
            <div className="text-sm font-semibold text-white">{snapshots.length} Verified</div>
          </div>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {toastMessage && (
        <div className="p-3 rounded-lg border border-neutral-700 bg-neutral-950 text-white text-xs flex items-center gap-2 animate-in fade-in duration-200 font-mono">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Sub-Tabs Bar with Interactive Scroll Controls */}
      <div className="relative flex items-center gap-1.5 border-b border-neutral-900 pb-2.5 font-mono select-none">
        {/* Left Scroll Chevron */}
        {!wrapAdminTabs && (
          <button
            type="button"
            onClick={() => scrollAdminTabsBy('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll admin tabs left"
            className={`p-1.5 rounded-lg border transition-all z-10 shrink-0 ${
              canScrollLeft
                ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 hover:border-neutral-700 active:scale-90 cursor-pointer shadow-md'
                : 'bg-black border-neutral-950 text-neutral-700 opacity-40 cursor-default'
            }`}
            title="Scroll left (or use mouse wheel / trackpad)"
          >
            <ChevronLeft size={15} />
          </button>
        )}

        {/* Scrollable Tabs Track */}
        <div
          ref={adminTabsRef}
          onWheel={handleTabsWheel}
          onMouseDown={handleMouseDownTabs}
          onMouseMove={handleMouseMoveTabs}
          onMouseUp={handleMouseUpOrLeaveTabs}
          onMouseLeave={handleMouseUpOrLeaveTabs}
          onScroll={checkTabsScrollable}
          className={`flex items-center gap-2 flex-1 scroll-smooth cursor-grab active:cursor-grabbing ${
            wrapAdminTabs
              ? 'flex-wrap'
              : 'overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-950 hover:scrollbar-thumb-neutral-700'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: wrapAdminTabs ? 'auto' : 'pan-x'
          }}
        >
          {[
            { id: 'users', label: 'Users', icon: Users, badge: `${users.length}` },
            { id: 'roles', label: 'Roles & RBAC', icon: Shield, badge: `${roles.length}` },
            { id: 'nodes', label: 'Nodes & Fleet', icon: Server, badge: `${nodes.length}` },
            { id: 'network', label: 'IPv4 / IPv6 Config', icon: Network },
            { id: 'firewall', label: 'Firewall & Security', icon: ShieldCheck, badge: `${firewallRules.length}` },
            { id: 'storage', label: 'Storage & Volumes', icon: HardDrive, badge: `${storageVolumes.length}` },
            { id: 'backups', label: 'Backups & Snapshots', icon: Archive, badge: `${snapshots.length}` },
            { id: 'console', label: 'VPS Terminal (apt / service)', icon: Terminal },
            { id: 'system', label: 'System Info', icon: Cpu },
            { id: 'governance', label: 'Governance', icon: Sliders }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setAdminTab(tab.id as typeof adminTab);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white border border-neutral-700 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-950 border border-neutral-900/80 hover:border-neutral-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-neutral-500'} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 rounded border ${
                    isActive ? 'bg-black border-neutral-700 text-neutral-300' : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Chevron */}
        {!wrapAdminTabs && (
          <button
            type="button"
            onClick={() => scrollAdminTabsBy('right')}
            disabled={!canScrollRight}
            aria-label="Scroll admin tabs right"
            className={`p-1.5 rounded-lg border transition-all z-10 shrink-0 ${
              canScrollRight
                ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 hover:border-neutral-700 active:scale-90 cursor-pointer shadow-md'
                : 'bg-black border-neutral-950 text-neutral-700 opacity-40 cursor-default'
            }`}
            title="Scroll right (or use mouse wheel / trackpad)"
          >
            <ChevronRight size={15} />
          </button>
        )}

        {/* Wrap / Ribbon Grid Toggle */}
        <button
          type="button"
          onClick={() => setWrapAdminTabs(prev => !prev)}
          className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
            wrapAdminTabs
              ? 'bg-neutral-900 border-neutral-700 text-amber-400'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
          }`}
          title={wrapAdminTabs ? 'Switch to scrollable ribbon' : 'Wrap all tabs into a grid'}
          aria-label="Toggle tabs wrapping"
        >
          {wrapAdminTabs ? <List size={15} /> : <LayoutGrid size={15} />}
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {adminTab === 'users' && (
        <div className="space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Filter users by name or email..."
                  className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-900 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-black border border-neutral-900 rounded-lg text-xs text-neutral-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddUser(true)}
              className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <UserPlus size={14} />
              <span>Add User</span>
            </button>
          </div>

          <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden divide-y divide-neutral-900">
            {filteredUsers.map(u => (
              <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-950/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-semibold text-white mt-0.5">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{u.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          u.status === 'active'
                            ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-400'
                            : 'border-red-900/60 bg-red-950/40 text-red-400'
                        }`}
                      >
                        {u.status}
                      </span>
                      {u.twoFactor && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300 flex items-center gap-1">
                          <ShieldCheck size={11} className="text-white" /> 2FA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400">{u.email}</div>
                    <div className="text-[11px] text-neutral-500">Last login: {u.lastLogin} &bull; {u.sessionsCount} sessions</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <select
                    value={u.role}
                    onChange={e => handleChangeUserRole(u.id, e.target.value)}
                    className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 cursor-pointer"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleToggleUserStatus(u.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white"
                  >
                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400"
                    title="Delete User"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & RBAC */}
      {adminTab === 'roles' && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white">Cluster RBAC Policies</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Role-based access matrix enforcing boundary controls.</p>
            </div>
            <button
              onClick={() => setShowCreateRole(true)}
              className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Create Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(role => (
              <div key={role.id} className="p-4 rounded-xl border border-neutral-900 bg-black space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{role.name}</h4>
                    <span className="text-[10px] text-amber-400">{role.level}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                    {role.userCount} Users
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">{role.description}</p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className={`p-1.5 rounded border ${role.permissions.clusterMesh ? 'border-neutral-800 bg-neutral-950 text-white' : 'border-neutral-950 bg-black text-neutral-600'}`}>
                    Cluster Mesh: {role.permissions.clusterMesh ? 'ALLOW' : 'DENY'}
                  </div>
                  <div className={`p-1.5 rounded border ${role.permissions.nodeDrain ? 'border-neutral-800 bg-neutral-950 text-white' : 'border-neutral-950 bg-black text-neutral-600'}`}>
                    Node Drain: {role.permissions.nodeDrain ? 'ALLOW' : 'DENY'}
                  </div>
                  <div className={`p-1.5 rounded border ${role.permissions.secretsVault ? 'border-neutral-800 bg-neutral-950 text-white' : 'border-neutral-950 bg-black text-neutral-600'}`}>
                    Secrets Vault: {role.permissions.secretsVault ? 'ALLOW' : 'DENY'}
                  </div>
                  <div className={`p-1.5 rounded border ${role.permissions.terminalPty ? 'border-neutral-800 bg-neutral-950 text-white' : 'border-neutral-950 bg-black text-neutral-600'}`}>
                    Terminal PTY: {role.permissions.terminalPty ? 'ALLOW' : 'DENY'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CLUSTER NODES & SERVERS */}
      {adminTab === 'nodes' && (
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white">Cluster Fleet & Nodes</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Control plane, worker edge, and NVMe storage members.</p>
            </div>
            <button
              onClick={() => setShowAddNode(true)}
              className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Provision Node</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {nodes.map(node => (
              <div key={node.id} className="p-4 rounded-xl border border-neutral-900 bg-black space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{node.name}</h4>
                    <span className="text-[10px] text-neutral-500">{node.role} &bull; {node.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        node.status === 'online'
                          ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-400'
                          : node.status === 'draining'
                          ? 'border-amber-900/60 bg-amber-950/40 text-amber-400'
                          : 'border-blue-900/60 bg-blue-950/40 text-blue-400'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[10px] text-neutral-500">IPv4 Address</div>
                    <div className="text-neutral-200 select-all">{node.ipv4}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500">IPv6 Address</div>
                    <div className="text-neutral-200 select-all truncate">{node.ipv6}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500">CPU Load</div>
                    <div className="text-white font-medium">{node.cpuPercent}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-500">Memory Allocation</div>
                    <div className="text-white font-medium">{node.memoryUsedGB} / {node.memoryTotalGB} GB</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                  <button
                    onClick={() => handleToggleNodeDrain(node.id)}
                    className="flex-1 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white"
                  >
                    {node.status === 'draining' ? 'Undrain Node' : 'Drain Traffic'}
                  </button>
                  <button
                    onClick={() => handleRebootNode(node.id)}
                    className="flex-1 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    <span>Reboot Node</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOM IPV4 / IPV6 NETWORKING */}
      {adminTab === 'network' && (
        <div className="max-w-3xl space-y-4 font-mono">
          <div className="p-5 rounded-xl border border-neutral-900 bg-black space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Network size={16} className="text-white" />
                <h3 className="text-xs uppercase tracking-wider font-semibold text-white">Custom IP Networking & Interface Binding</h3>
              </div>
              <button
                onClick={() => showFeedback('Network configuration committed to kernel via systemd-networkd.')}
                className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
              >
                Apply & Save
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Cluster Hostname FQDN</label>
                <input
                  type="text"
                  value={networkConfig.hostname}
                  onChange={e => setNetworkConfig({ ...networkConfig, hostname: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Primary Physical NIC</label>
                <input
                  type="text"
                  value={networkConfig.primaryInterface}
                  onChange={e => setNetworkConfig({ ...networkConfig, primaryInterface: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Custom IPv4 Static Allocation</label>
                <input
                  type="text"
                  value={networkConfig.customIpv4}
                  onChange={e => setNetworkConfig({ ...networkConfig, customIpv4: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">IPv4 Gateway</label>
                <input
                  type="text"
                  value={networkConfig.ipv4Gateway}
                  onChange={e => setNetworkConfig({ ...networkConfig, ipv4Gateway: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Custom IPv6 Static Prefix</label>
                <input
                  type="text"
                  value={networkConfig.customIpv6}
                  onChange={e => setNetworkConfig({ ...networkConfig, customIpv6: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">IPv6 Gateway</label>
                <input
                  type="text"
                  value={networkConfig.ipv6Gateway}
                  onChange={e => setNetworkConfig({ ...networkConfig, ipv6Gateway: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Primary Upstream DNS</label>
                <input
                  type="text"
                  value={networkConfig.primaryDns}
                  onChange={e => setNetworkConfig({ ...networkConfig, primaryDns: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Frame MTU Size</label>
                <input
                  type="number"
                  value={networkConfig.mtu}
                  onChange={e => setNetworkConfig({ ...networkConfig, mtu: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-900 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={networkConfig.ipForwarding}
                  onChange={e => setNetworkConfig({ ...networkConfig, ipForwarding: e.target.checked })}
                  className="accent-white"
                />
                <span>Enable IP Forwarding (`net.ipv4.ip_forward = 1`)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={networkConfig.bbrCongestionControl}
                  onChange={e => setNetworkConfig({ ...networkConfig, bbrCongestionControl: e.target.checked })}
                  className="accent-white"
                />
                <span>Enable BBR TCP Congestion Control</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FIREWALL & SECURITY */}
      {adminTab === 'firewall' && (
        <div className="space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" />
                Cluster Firewall & eBPF Netfilter
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Packet inspection policies, ingress controls, and live hit meters.</p>
            </div>
            <button
              onClick={() => setShowAddFwRule(true)}
              className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <Plus size={14} />
              <span>Add Firewall Rule</span>
            </button>
          </div>

          {/* Defense Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-neutral-900 bg-black flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">SYN-Flood Shield</div>
                <div className="text-[10px] text-neutral-500">eBPF XDP SYN proxy active</div>
              </div>
              <input
                type="checkbox"
                checked={synFloodShield}
                onChange={e => {
                  setSynFloodShield(e.target.checked);
                  showFeedback(`SYN Flood protection ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                }}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-900 bg-black flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Geo-IP ASN Blocking</div>
                <div className="text-[10px] text-neutral-500">Drop untrusted cloud autonomous systems</div>
              </div>
              <input
                type="checkbox"
                checked={geoIpFiltering}
                onChange={e => {
                  setGeoIpFiltering(e.target.checked);
                  showFeedback(`Geo-IP filtering ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                }}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-900 bg-black flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Port Scan Blocker</div>
                <div className="text-[10px] text-neutral-500">Auto-null route rapid probing IPs</div>
              </div>
              <input
                type="checkbox"
                checked={portScanDrop}
                onChange={e => {
                  setPortScanDrop(e.target.checked);
                  showFeedback(`Port scan blocker ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                }}
                className="w-4 h-4 accent-white cursor-pointer"
              />
            </div>
          </div>

          {/* Firewall Table */}
          <div className="rounded-xl border border-neutral-900 bg-black overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-neutral-950 text-neutral-500 border-b border-neutral-900 text-[10px] uppercase">
                <tr>
                  <th className="p-3"># Priority</th>
                  <th className="p-3">Dir</th>
                  <th className="p-3">Proto</th>
                  <th className="p-3">Port / Service</th>
                  <th className="p-3">Source CIDR</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Policy</th>
                  <th className="p-3">Matched Hits</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {firewallRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-neutral-950/40">
                    <td className="p-3 text-neutral-400 font-bold">#{rule.priority}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${rule.direction === 'IN' ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-neutral-800 bg-neutral-950 text-neutral-400'}`}>
                        {rule.direction}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-white">{rule.protocol}</td>
                    <td className="p-3 text-neutral-300">{rule.port}</td>
                    <td className="p-3 text-neutral-400 select-all">{rule.cidr}</td>
                    <td className="p-3 text-neutral-400">{rule.target}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${rule.action === 'ACCEPT' ? 'border-emerald-900/60 bg-emerald-950/40 text-emerald-400' : 'border-red-900/60 bg-red-950/40 text-red-400'}`}>
                        {rule.action}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-300 font-mono">{rule.hits.toLocaleString()}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleFwRule(rule.id)}
                        className={`px-2 py-1 rounded text-[10px] border ${rule.enabled ? 'border-neutral-800 bg-neutral-900 text-white' : 'border-neutral-900 bg-black text-neutral-600'}`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleDeleteFwRule(rule.id)}
                        className="p-1 rounded text-neutral-500 hover:text-red-400"
                        title="Delete rule"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: STORAGE & VOLUMES */}
      {adminTab === 'storage' && (
        <div className="space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white flex items-center gap-2">
                <HardDrive size={15} className="text-white" />
                Storage Pools & Persistent Volumes (PVC)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">NVMe block pools, ZFS file hierarchies, and encryption layers.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunTrim}
                className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white"
              >
                Run TRIM Discard
              </button>
              <button
                onClick={() => setShowCreateVolume(true)}
                className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-2"
              >
                <Plus size={14} />
                <span>New Volume</span>
              </button>
            </div>
          </div>

          {/* NVMe Pool Health Card */}
          <div className="p-4 rounded-xl border border-neutral-900 bg-black grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[10px] text-neutral-500">Total NVMe Capacity</div>
              <div className="text-sm font-semibold text-white">32.0 TB</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">Allocated Space</div>
              <div className="text-sm font-semibold text-amber-400">8.4 TB (26%)</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">Mesh IOPS Benchmark</div>
              <div className="text-sm font-semibold text-emerald-400">820,000 IOPS</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-500">Hardware RAID</div>
              <div className="text-sm font-semibold text-white">ZFS RAID-Z2 (Optimal)</div>
            </div>
          </div>

          {/* Volumes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storageVolumes.map(vol => (
              <div key={vol.id} className="p-4 rounded-xl border border-neutral-900 bg-black space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{vol.name}</h4>
                    <span className="text-[10px] text-neutral-500">{vol.filesystem} &bull; {vol.sizeGB} GB &bull; {vol.encrypted ? 'LUKS AES-256' : 'Plain'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-400">
                    {vol.health}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-neutral-400">
                    Mount Path: <code className="text-neutral-200 select-all">{vol.mountPath}</code>
                  </div>
                  <div className="text-neutral-400">
                    Attached Node: <span className="text-white">{vol.nodeMount}</span>
                  </div>
                  <div className="text-neutral-400">
                    Sustained IOPS: <span className="text-neutral-300">{vol.iops.toLocaleString()} IOPS</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                  <button
                    onClick={() => showFeedback(`Volume ${vol.name} snapshot created in ZFS pool.`)}
                    className="text-neutral-400 hover:text-white"
                  >
                    Take Snapshot
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete volume ${vol.name}? Data will be unrecoverable.`)) {
                        setStorageVolumes(prev => prev.filter(v => v.id !== vol.id));
                        showFeedback(`Volume ${vol.name} deleted.`);
                      }
                    }}
                    className="text-neutral-600 hover:text-red-400"
                  >
                    Delete Volume
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: BACKUPS & SNAPSHOTS */}
      {adminTab === 'backups' && (
        <div className="space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white flex items-center gap-2">
                <Archive size={15} className="text-white" />
                Cluster Backups & Cryptographic Snapshots
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">Automated ZFS point-in-time images with SHA-256 seals.</p>
            </div>
            <button
              onClick={handleCreateSnapshot}
              disabled={isCreatingSnapshot}
              className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shrink-0 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isCreatingSnapshot ? 'animate-spin' : ''} />
              <span>{isCreatingSnapshot ? 'Creating Snapshot...' : 'Create Instant Snapshot'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-neutral-900 bg-black flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-300">Daily Automated Schedule: 02:00 UTC (14-day retention)</span>
            </div>
            <div className="text-neutral-500">
              S3 Offsite Vault: <span className="text-emerald-400">Replication Connected</span>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden divide-y divide-neutral-900">
            {snapshots.map(snap => (
              <div key={snap.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-950/40 transition-colors text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{snap.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 uppercase">
                      {snap.type}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-400">
                      {snap.status}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px]">Timestamp: {snap.timestamp} &bull; Size: {snap.size}</div>
                  <div className="text-neutral-500 text-[11px] select-all">Checksum: {snap.checksum}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${snap.name}.manifest.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showFeedback(`Downloaded backup manifest for ${snap.name}.`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-white"
                  >
                    <Download size={13} />
                    <span>Download Manifest</span>
                  </button>
                  <button
                    onClick={() => showFeedback(`Restoration point simulation verified for ${snap.name}.`)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white"
                  >
                    Verify Image
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: REAL VPS TERMINAL (Debian 12 with apt & service) */}
      {adminTab === 'console' && (
        <div className="space-y-3 font-mono">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-amber-400" />
                <h3 className="text-xs uppercase tracking-wider font-semibold text-white">
                  Debian 12 VPS Root Shell (apt & service)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-900/60 bg-emerald-950/40 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Real Container
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-300">
                  uid=0(root)
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real Linux execution engine with native Debian 12 package manager (<code className="text-amber-300">apt</code>), service daemon control (<code className="text-amber-300">service</code>), and root privileges.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              {/* Reset Shell / Clear */}
              <button
                type="button"
                onClick={() => {
                  setCliLines([
                    { text: 'Debian GNU/Linux 12 (bookworm) VPS Node (kernel 6.6.x x86_64)', type: 'gcp' },
                    { text: 'Active Root Shell - Real container execution environment (/usr/sbin/service, /usr/bin/apt)', type: 'info' },
                    { text: 'Persistent filesystem mounted at /app/applet with full root capabilities.', type: 'info' },
                    { text: 'Try: "service nginx status", "service --status-all", "apt list --installed | head -n 15", "apt --version"', type: 'info' },
                    { text: 'Type any Linux command below to execute directly on the live VPS container.', type: 'gcp' }
                  ]);
                  showFeedback('VPS Terminal buffer refreshed.');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-white text-xs transition-colors"
                title="Reset Terminal Shell Buffer"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={() => setCliLines([])}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs transition-colors"
                title="Clear Terminal Output"
              >
                <Trash2 size={12} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Quick VPS Linux Command Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-neutral-500 mr-1 flex items-center gap-1">
              <Zap size={11} className="text-amber-400" /> Real VPS Commands:
            </span>
            {[
              { label: 'service nginx status', cmd: 'service nginx status' },
              { label: 'service --status-all', cmd: 'service --status-all' },
              { label: 'apt --version', cmd: 'apt --version' },
              { label: 'apt list (head)', cmd: 'apt list --installed 2>/dev/null | head -n 15' },
              { label: 'service nginx restart', cmd: 'service nginx restart && service nginx status' },
              { label: 'cat /etc/os-release', cmd: 'cat /etc/os-release' },
              { label: 'dpkg -l (head)', cmd: 'dpkg -l | head -n 12' },
              { label: 'uname -a', cmd: 'uname -a' },
              { label: 'df -h', cmd: 'df -h' },
              { label: 'free -m', cmd: 'free -m' },
              { label: 'ps aux (head)', cmd: 'ps aux | head -n 12' }
            ].map(item => (
              <button
                key={item.cmd}
                type="button"
                disabled={isExecutingCmd}
                onClick={async () => {
                  setCliInput(item.cmd);
                  const cmd = item.cmd;
                  setCliHistory(prev => [...prev, cmd]);
                  setCliHistoryIndex(-1);
                  setCliLines(prev => [
                    ...prev,
                    { text: `root@vps-debian:~# ${cmd}`, type: 'cmd' }
                  ]);
                  setCliInput('');
                  setIsExecutingCmd(true);
                  try {
                    const response = await fetch('/api/terminal/exec', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ command: cmd })
                    });
                    const data = await response.json();
                    const newLines: Array<{ text: string; type: 'cmd' | 'out' | 'err' | 'info' | 'gcp' }> = [];
                    if (data.stdout) {
                      const lines = data.stdout.split('\n');
                      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
                      lines.forEach((l: string) => newLines.push({ text: l, type: 'out' }));
                    }
                    if (data.stderr) {
                      const lines = data.stderr.split('\n');
                      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
                      lines.forEach((l: string) => newLines.push({ text: l, type: 'err' }));
                    }
                    if (!data.stdout && !data.stderr) {
                      newLines.push({ text: `[Command completed with exit code ${data.exitCode}]`, type: 'info' });
                    }
                    setCliLines(prev => [...prev, ...newLines]);
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Execution failed';
                    setCliLines(prev => [...prev, { text: `vps-terminal: ${msg}`, type: 'err' }]);
                  } finally {
                    setIsExecutingCmd(false);
                    setTimeout(() => {
                      if (cliScrollRef.current) cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
                    }, 50);
                  }
                }}
                className="px-2.5 py-1 rounded bg-neutral-950 border border-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 text-[11px] transition-colors disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Terminal Screen Container */}
          <div className="rounded-xl border border-neutral-800 bg-black overflow-hidden shadow-2xl flex flex-col h-[460px]">
            {/* Terminal Tab Bar */}
            <div className="px-4 py-2 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  root@vps-debian:~# (bash)
                </span>
                <span className="text-neutral-700">&bull;</span>
                <span className="text-neutral-400 select-all">
                  node: <span className="text-amber-400">vps-debian-node-01</span>
                </span>
                <span className="text-neutral-700 hidden sm:inline">&bull;</span>
                <span className="text-neutral-500 hidden sm:inline">
                  service: <span className="text-emerald-400">systemv / openrc active</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                <span className="hidden md:inline text-neutral-400">
                  /usr/sbin/service &bull; /usr/bin/apt
                </span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  Debian 12 bookworm x86_64
                </span>
              </div>
            </div>

            {/* Terminal Screen Buffer */}
            <div
              ref={cliScrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-1 font-mono text-xs select-text scrollbar-thin scrollbar-thumb-neutral-800"
            >
              {cliLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed whitespace-pre-wrap ${
                    line.type === 'cmd'
                      ? 'text-white font-bold'
                      : line.type === 'gcp'
                      ? 'text-emerald-400'
                      : line.type === 'info'
                      ? 'text-neutral-400'
                      : line.type === 'err'
                      ? 'text-red-400'
                      : 'text-neutral-300'
                  }`}
                >
                  {line.text}
                </div>
              ))}
              {isExecutingCmd && (
                <div className="flex items-center gap-2 text-amber-400 text-xs py-1">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Executing command in Debian VPS container...</span>
                </div>
              )}
            </div>

            {/* Terminal Prompt Input Form */}
            <form onSubmit={handleCliSubmit} className="p-2.5 border-t border-neutral-900 bg-neutral-950 flex items-center gap-2">
              <span className="text-xs pl-2 shrink-0 font-mono">
                <span className="text-emerald-400 font-semibold">root@vps-debian</span>
                <span className="text-neutral-400">:</span>
                <span className="text-blue-400 font-semibold">~</span>
                <span className="text-amber-400 font-medium">#</span>
              </span>
              <input
                type="text"
                autoFocus
                disabled={isExecutingCmd}
                value={cliInput}
                onChange={e => setCliInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (cliHistory.length > 0) {
                      const nextIdx = cliHistoryIndex === -1 ? cliHistory.length - 1 : Math.max(0, cliHistoryIndex - 1);
                      setCliHistoryIndex(nextIdx);
                      setCliInput(cliHistory[nextIdx]);
                    }
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (cliHistoryIndex !== -1) {
                      const nextIdx = cliHistoryIndex + 1;
                      if (nextIdx < cliHistory.length) {
                        setCliHistoryIndex(nextIdx);
                        setCliInput(cliHistory[nextIdx]);
                      } else {
                        setCliHistoryIndex(-1);
                        setCliInput('');
                      }
                    }
                  }
                }}
                placeholder="Type real Linux command (e.g. service nginx status, service --status-all, apt --version, df -h, help)..."
                className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isExecutingCmd || !cliInput.trim()}
                className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors border border-neutral-800"
              >
                {isExecutingCmd ? (
                  <>
                    <RefreshCw size={11} className="animate-spin text-amber-400" />
                    <span>Running</span>
                  </>
                ) : (
                  <span>Execute</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 9: SYSTEM INFO */}
      {adminTab === 'system' && (
        <div className="space-y-4 font-mono">
          <div className="p-5 rounded-xl border border-neutral-900 bg-black space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white">Hardware & Kernel Telemetry</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950">
                <div className="text-[10px] text-neutral-500 uppercase">Processors</div>
                <div className="text-white font-medium mt-1">2x AMD EPYC 9654 (192 Cores, 384 Threads)</div>
                <div className="text-neutral-500 text-[11px] mt-0.5">AVX-512 &bull; 3.70 GHz Max Boost</div>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950">
                <div className="text-[10px] text-neutral-500 uppercase">System Memory</div>
                <div className="text-white font-medium mt-1">512 GB DDR5-4800 ECC Registered</div>
                <div className="text-neutral-500 text-[11px] mt-0.5">8-Channel Octa-Rank Active</div>
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950">
                <div className="text-[10px] text-neutral-500 uppercase">Kernel Release</div>
                <div className="text-white font-medium mt-1">Linux 6.8.0-45-generic (x86_64)</div>
                <div className="text-neutral-500 text-[11px] mt-0.5">eBPF, WireGuard, and cgroup-v2 enabled</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: GOVERNANCE & SECURITY */}
      {adminTab === 'governance' && (
        <div className="space-y-4 font-mono">
          <div className="p-5 rounded-xl border border-neutral-900 bg-black space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white">Global Cluster Policies</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Cluster Strict TLS 1.3 Only</div>
                  <div className="text-neutral-500 text-[11px]">Reject all cipher negotiations below TLSv1.3</div>
                </div>
                <input
                  type="checkbox"
                  checked={strictTLS}
                  onChange={e => setStrictTLS(e.target.checked)}
                  className="w-4 h-4 accent-white"
                />
              </div>

              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950 flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">Global Rate Limiting</div>
                  <div className="text-neutral-500 text-[11px]">Threshold: {rateLimit} req/sec per CIDR</div>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={rateLimit}
                  onChange={e => setRateLimit(Number(e.target.value))}
                  className="accent-white cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-lg border border-red-950 bg-black flex items-center justify-between">
                <div>
                  <div className="text-red-400 font-medium">Emergency Cluster Lockdown</div>
                  <div className="text-neutral-500 text-[11px]">Isolates all external traffic except localhost bastion</div>
                </div>
                <button
                  onClick={() => {
                    const next = !adminLockdown;
                    setAdminLockdown(next);
                    showFeedback(`Emergency lockdown ${next ? 'ACTIVATED' : 'DEACTIVATED'}.`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${adminLockdown ? 'bg-red-600 text-white' : 'border border-red-900 text-red-400'}`}
                >
                  {adminLockdown ? 'Disengage Lockdown' : 'Engage Lockdown'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM LOGS TERMINAL INTEGRATED BOTTOM PANEL */}
      <div className="pt-2">
        <SystemLogsTerminal />
      </div>

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-black border border-neutral-800 text-white space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-white" />
                <h3 className="text-xs uppercase tracking-wider font-semibold">Provision Cluster Operator</h3>
              </div>
              <button onClick={() => setShowAddUser(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Liam Sterling"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. l.sterling@cluster.local"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Assigned RBAC Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name} ({r.level})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                >
                  Create User & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROLE MODAL */}
      {showCreateRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-black border border-neutral-800 text-white space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <h3 className="text-xs uppercase tracking-wider font-semibold">Define Custom RBAC Role</h3>
              </div>
              <button onClick={() => setShowCreateRole(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. SRE Incident Responder"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Clearance Tier</label>
                <input
                  type="text"
                  value={newRoleLevel}
                  onChange={e => setNewRoleLevel(e.target.value)}
                  placeholder="e.g. Tier 2 (Incident Response)"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Description / Policy Scope</label>
                <textarea
                  rows={2}
                  value={newRoleDescription}
                  onChange={e => setNewRoleDescription(e.target.value)}
                  placeholder="Detailed explanation of the security boundaries for this role..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                >
                  Establish Role & Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION NODE MODAL */}
      {showAddNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-black border border-neutral-800 text-white space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-white" />
                <h3 className="text-xs uppercase tracking-wider font-semibold">Provision Server Node</h3>
              </div>
              <button onClick={() => setShowAddNode(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Node Hostname</label>
                <input
                  type="text"
                  required
                  value={newNodeName}
                  onChange={e => setNewNodeName(e.target.value)}
                  placeholder="e.g. edge-worker-us-west-03"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Node Role</label>
                <select
                  value={newNodeRole}
                  onChange={e => setNewNodeRole(e.target.value as typeof newNodeRole)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  <option value="Worker Edge">Worker Edge</option>
                  <option value="Ingress Proxy">Ingress Proxy</option>
                  <option value="Storage Volume">Storage Volume</option>
                  <option value="Control Plane">Control Plane</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Custom IPv4 Address</label>
                <input
                  type="text"
                  value={newNodeIpv4}
                  onChange={e => setNewNodeIpv4(e.target.value)}
                  placeholder="e.g. 10.240.0.25"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                >
                  Join Node to Cluster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FIREWALL RULE MODAL */}
      {showAddFwRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-black border border-neutral-800 text-white space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="text-xs uppercase tracking-wider font-semibold">Add Firewall Rule</h3>
              </div>
              <button onClick={() => setShowAddFwRule(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddFwRuleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Priority</label>
                  <input
                    type="number"
                    required
                    value={newFwPriority}
                    onChange={e => setNewFwPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Direction</label>
                  <select
                    value={newFwDirection}
                    onChange={e => setNewFwDirection(e.target.value as 'IN' | 'OUT')}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  >
                    <option value="IN">IN (Ingress)</option>
                    <option value="OUT">OUT (Egress)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Protocol</label>
                  <select
                    value={newFwProtocol}
                    onChange={e => setNewFwProtocol(e.target.value as 'TCP' | 'UDP' | 'ICMP')}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Port / Range</label>
                  <input
                    type="text"
                    required
                    value={newFwPort}
                    onChange={e => setNewFwPort(e.target.value)}
                    placeholder="e.g. 8080 or 8000-8010"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Source CIDR</label>
                <input
                  type="text"
                  required
                  value={newFwCidr}
                  onChange={e => setNewFwCidr(e.target.value)}
                  placeholder="e.g. 192.168.1.0/24 or 0.0.0.0/0"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Policy Action</label>
                <select
                  value={newFwAction}
                  onChange={e => setNewFwAction(e.target.value as 'ACCEPT' | 'DROP' | 'REJECT')}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  <option value="ACCEPT">ACCEPT (Allow Traffic)</option>
                  <option value="DROP">DROP (Silently Discard)</option>
                  <option value="REJECT">REJECT (TCP Reset)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                >
                  Append Rule to Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STORAGE VOLUME MODAL */}
      {showCreateVolume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-black border border-neutral-800 text-white space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-white" />
                <h3 className="text-xs uppercase tracking-wider font-semibold">Provision NVMe Block Volume</h3>
              </div>
              <button onClick={() => setShowCreateVolume(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleAddVolumeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Volume Name</label>
                <input
                  type="text"
                  required
                  value={newVolName}
                  onChange={e => setNewVolName(e.target.value)}
                  placeholder="e.g. pvc-elasticsearch-indices"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Size (GB)</label>
                  <input
                    type="number"
                    required
                    value={newVolSize}
                    onChange={e => setNewVolSize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Filesystem</label>
                  <select
                    value={newVolFs}
                    onChange={e => setNewVolFs(e.target.value as 'ZFS' | 'ext4' | 'XFS')}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                  >
                    <option value="ZFS">ZFS (Snapshots & RAID)</option>
                    <option value="ext4">ext4 (Standard POSIX)</option>
                    <option value="XFS">XFS (High Throughput)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Mount Path</label>
                <input
                  type="text"
                  required
                  value={newVolPath}
                  onChange={e => setNewVolPath(e.target.value)}
                  placeholder="e.g. /mnt/data/elasticsearch"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Target Cluster Node</label>
                <select
                  value={newVolMount}
                  onChange={e => setNewVolMount(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white"
                >
                  {nodes.map(n => (
                    <option key={n.id} value={n.name}>{n.name} ({n.role})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                >
                  Format & Mount Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
