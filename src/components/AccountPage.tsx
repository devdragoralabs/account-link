import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  Copy,
  AlertTriangle,
  Laptop,
  Globe,
  Clock,
  Trash2,
  CheckCircle2,
  QrCode,
  RefreshCw,
  LogOut,
  Terminal,
  Bell,
  Plus,
  Send,
  Code,
  FileCode,
  KeyRound,
  Radio,
  ExternalLink
} from 'lucide-react';

export interface UserAccountData {
  displayName: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'totp' | 'sms' | 'security_key';
  backupCodes: string[];
  sessionTimeoutMinutes: number;
}

export interface ApiTokenItem {
  id: string;
  name: string;
  prefix: string;
  fullToken?: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string;
  lastUsed: string;
}

export interface SshKeyItem {
  id: string;
  title: string;
  keyType: string;
  fingerprint: string;
  publicKey: string;
  createdAt: string;
  lastUsed: string;
}

export interface WebhookAlertConfig {
  emailAlerts: boolean;
  smsAlerts: boolean;
  phoneNumber: string;
  webhookUrl: string;
  webhookSecret: string;
  alertOnAuthFailure: boolean;
  alertOnNodeDrain: boolean;
  alertOnRoleEscalation: boolean;
}

const DEFAULT_ACCOUNT: UserAccountData = {
  displayName: 'Alex Mercer',
  email: 'admin@cluster.local',
  role: 'Superadmin / Cluster Architect',
  twoFactorEnabled: true,
  twoFactorMethod: 'totp',
  backupCodes: [
    'A9F2-4821',
    '33B7-99E1',
    '88D4-1029',
    '72C6-44B0',
    '15E9-73A2',
    '90A1-33F8',
    '44D2-8810',
    '61B5-92E4'
  ],
  sessionTimeoutMinutes: 60
};

const DEFAULT_API_TOKENS: ApiTokenItem[] = [
  {
    id: 'tok-1',
    name: 'ci-github-deployer',
    prefix: 'pat_live_8f92••••••••4a10',
    scopes: ['cluster:read', 'nodes:write', 'metrics:export'],
    createdAt: '2026-10-14',
    expiresAt: '2027-10-14 (337 days)',
    lastUsed: '12 minutes ago'
  },
  {
    id: 'tok-2',
    name: 'prometheus-telemetry-pull',
    prefix: 'pat_live_33b1••••••••99c2',
    scopes: ['cluster:read', 'metrics:export'],
    createdAt: '2026-11-01',
    expiresAt: 'Never (Infinite)',
    lastUsed: 'Active now'
  },
  {
    id: 'tok-3',
    name: 'dev-workstation-cli',
    prefix: 'pat_live_12ea••••••••77b4',
    scopes: ['cluster:read', 'nodes:write', 'network:read'],
    createdAt: '2026-11-08',
    expiresAt: '2026-12-08 (27 days)',
    lastUsed: '2 hours ago'
  }
];

const DEFAULT_SSH_KEYS: SshKeyItem[] = [
  {
    id: 'ssh-1',
    title: 'MacBook M3 Max (id_ed25519)',
    keyType: 'ED25519',
    fingerprint: 'SHA256:4X7mQ9tZ2k1L8vW6p0yR5uJ3sF4dE1aB9cO8iP7hG2w',
    publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPq019Mlx7pQ3sB8wD2f1K4jV9uL8zX7rY5tN3mQ2k1L alex@cluster.local',
    createdAt: '2026-09-10',
    lastUsed: 'Today, 22:15'
  },
  {
    id: 'ssh-2',
    title: 'Hardware YubiKey 5C (PKCS#11)',
    keyType: 'ED25519-SK',
    fingerprint: 'SHA256:9vW1p4jV7uL2zX5rY8tN1mQ6k3L0sB4wD7f2K9uL5zX',
    publicKey: 'sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIIn9... yubikey5c',
    createdAt: '2026-10-02',
    lastUsed: 'Yesterday, 14:02'
  }
];

const DEFAULT_WEBHOOK_CONFIG: WebhookAlertConfig = {
  emailAlerts: true,
  smsAlerts: true,
  phoneNumber: '+1 (555) 839-2041',
  webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
  webhookSecret: 'whsec_89f1a2c3d4e5f6a7b8c9d0e1f2a3b4c5',
  alertOnAuthFailure: true,
  alertOnNodeDrain: true,
  alertOnRoleEscalation: true
};

interface SessionItem {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface AuditLogItem {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'warning' | 'info';
}

export function AccountPage() {
  const [account, setAccount] = useState<UserAccountData>(() => {
    try {
      const saved = localStorage.getItem('cluster_account_data');
      if (saved) return { ...DEFAULT_ACCOUNT, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_ACCOUNT;
  });

  const [activeTab, setActiveTab] = useState<'security' | 'email' | 'tokens' | 'ssh' | 'notifications' | 'sessions' | 'logs'>('security');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Change Email state
  const [newEmail, setNewEmail] = useState('');
  const [emailPasswordVerification, setEmailPasswordVerification] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // 2FA modal state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [totpError, setTotpError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // API Tokens state
  const [apiTokens, setApiTokens] = useState<ApiTokenItem[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_account_tokens');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_API_TOKENS;
  });
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenExpiry, setNewTokenExpiry] = useState('90');
  const [newTokenScopes, setNewTokenScopes] = useState<string[]>(['cluster:read', 'nodes:write']);
  const [generatedTokenSecret, setGeneratedTokenSecret] = useState<string | null>(null);
  const [copiedNewToken, setCopiedNewToken] = useState(false);

  // SSH Keys state
  const [sshKeys, setSshKeys] = useState<SshKeyItem[]>(() => {
    try {
      const saved = localStorage.getItem('cluster_account_ssh_keys');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_SSH_KEYS;
  });
  const [showAddSshModal, setShowAddSshModal] = useState(false);
  const [newSshTitle, setNewSshTitle] = useState('');
  const [newSshKeyType, setNewSshKeyType] = useState('ED25519');
  const [newSshPublicKey, setNewSshPublicKey] = useState('');

  // Notifications state
  const [webhookConfig, setWebhookConfig] = useState<WebhookAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('cluster_account_webhooks');
      if (saved) return { ...DEFAULT_WEBHOOK_CONFIG, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_WEBHOOK_CONFIG;
  });
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'sess-1',
      device: 'MacBook Pro 16" (M3 Max)',
      browser: 'Chrome 128.0 (macOS 15.1)',
      ip: '192.168.1.42',
      location: 'San Francisco, CA, US',
      lastActive: 'Active now',
      isCurrent: true
    },
    {
      id: 'sess-2',
      device: 'iPhone 15 Pro',
      browser: 'Mobile Safari 17.5',
      ip: '172.56.21.90',
      location: 'San Francisco, CA, US',
      lastActive: '24 minutes ago',
      isCurrent: false
    },
    {
      id: 'sess-3',
      device: 'ThinkPad X1 Carbon',
      browser: 'Firefox 129.0 (Ubuntu 24.04)',
      ip: '10.0.4.15',
      location: 'Frankfurt, DE',
      lastActive: '3 days ago',
      isCurrent: false
    }
  ]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: 'log-1',
      action: 'Session Authentication Succeeded',
      detail: 'Interactive OAuth / WebAuthn token verified',
      timestamp: 'Today, 13:42:01',
      ip: '192.168.1.42',
      status: 'success'
    },
    {
      id: 'log-2',
      action: 'API Access Token Created',
      detail: 'Personal token "ci-github-deployer" granted 3 scopes',
      timestamp: 'Today, 11:20:14',
      ip: '192.168.1.42',
      status: 'info'
    },
    {
      id: 'log-3',
      action: 'Two-Factor Hardware Token Verified',
      detail: 'TOTP RFC-6238 challenge passed',
      timestamp: 'Yesterday, 09:12:44',
      ip: '192.168.1.42',
      status: 'success'
    },
    {
      id: 'log-4',
      action: 'SSH Public Key Authenticated',
      detail: 'Key SHA256:4X7mQ... connected to bastion port 22022',
      timestamp: '2026-11-08 21:05:11',
      ip: '192.168.1.42',
      status: 'success'
    },
    {
      id: 'log-5',
      action: 'Password Verified for Elevation',
      detail: 'Sudo security gate confirmed',
      timestamp: '2026-11-05 18:30:00',
      ip: '192.168.1.42',
      status: 'info'
    }
  ]);

  useEffect(() => {
    localStorage.setItem('cluster_account_data', JSON.stringify(account));
  }, [account]);

  useEffect(() => {
    localStorage.setItem('cluster_account_tokens', JSON.stringify(apiTokens));
  }, [apiTokens]);

  useEffect(() => {
    localStorage.setItem('cluster_account_ssh_keys', JSON.stringify(sshKeys));
  }, [sshKeys]);

  useEffect(() => {
    localStorage.setItem('cluster_account_webhooks', JSON.stringify(webhookConfig));
  }, [webhookConfig]);

  // Handle password change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 10) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 10 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPasswordStatus({ type: 'success', message: 'Password updated successfully across all cluster nodes.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action: 'Master Password Updated',
      detail: 'Password hash rotated using Argon2id with 64MB memory cost',
      timestamp: 'Just now',
      ip: '192.168.1.42',
      status: 'warning'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    setTimeout(() => {
      setPasswordStatus({ type: 'idle', message: '' });
    }, 4000);
  };

  // Handle email change
  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailStatus({ type: 'error', message: 'Please provide a valid email address.' });
      return;
    }
    if (!emailPasswordVerification) {
      setEmailStatus({ type: 'error', message: 'Account password required to confirm email change.' });
      return;
    }

    const previousEmail = account.email;
    setAccount(prev => ({ ...prev, email: newEmail }));
    setEmailStatus({
      type: 'success',
      message: `Primary email updated from ${previousEmail} to ${newEmail}.`
    });
    setNewEmail('');
    setEmailPasswordVerification('');

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action: 'Email Address Updated',
      detail: `Changed from ${previousEmail} to ${newEmail}`,
      timestamp: 'Just now',
      ip: '192.168.1.42',
      status: 'warning'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    setTimeout(() => {
      setEmailStatus({ type: 'idle', message: '' });
    }, 4500);
  };

  // Handle 2FA verification
  const handleVerifyTOTP = () => {
    const code = totpCode.join('');
    if (code.length < 6) {
      setTotpError('Please enter all 6 digits.');
      return;
    }
    setAccount(prev => ({ ...prev, twoFactorEnabled: true, twoFactorMethod: 'totp' }));
    setShow2FAModal(false);
    setTotpCode(['', '', '', '', '', '']);
    setTotpError('');

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action: 'Two-Factor Auth Enabled',
      detail: 'Hardware TOTP Authenticator application registered and verified',
      timestamp: 'Just now',
      ip: '192.168.1.42',
      status: 'success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleDisable2FA = () => {
    if (window.confirm('Disable Two-Factor Authentication?')) {
      setAccount(prev => ({ ...prev, twoFactorEnabled: false }));
      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        action: 'Two-Factor Auth Disabled',
        detail: 'Hardware TOTP protection turned off',
        timestamp: 'Just now',
        ip: '192.168.1.42',
        status: 'warning'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  // Handle API Token Creation
  const handleCreateTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const randomBytes = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('');
    const fullTokenSecret = `pat_live_${randomBytes}`;
    const prefix = `pat_live_${randomBytes.slice(0, 4)}••••••••${randomBytes.slice(-4)}`;

    const days = parseInt(newTokenExpiry, 10);
    const expiresText = isNaN(days) || days === 0 ? 'Never (Infinite)' : `${days} days`;

    const tokenItem: ApiTokenItem = {
      id: `tok-${Date.now()}`,
      name: newTokenName.trim(),
      prefix,
      fullToken: fullTokenSecret,
      scopes: newTokenScopes.length > 0 ? newTokenScopes : ['cluster:read'],
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: expiresText,
      lastUsed: 'Never'
    };

    setApiTokens(prev => [tokenItem, ...prev]);
    setGeneratedTokenSecret(fullTokenSecret);

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action: 'API Access Token Issued',
      detail: `Created token "${tokenItem.name}" with scopes: ${tokenItem.scopes.join(', ')}`,
      timestamp: 'Just now',
      ip: '192.168.1.42',
      status: 'info'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleRevokeToken = (tokenId: string) => {
    const target = apiTokens.find(t => t.id === tokenId);
    if (!target) return;
    if (window.confirm(`Revoke API token "${target.name}"? Applications using this token will fail immediately.`)) {
      setApiTokens(prev => prev.filter(t => t.id !== tokenId));
      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        action: 'API Access Token Revoked',
        detail: `Revoked token "${target.name}"`,
        timestamp: 'Just now',
        ip: '192.168.1.42',
        status: 'warning'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  // Handle SSH Key Addition
  const handleAddSshKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSshTitle.trim() || !newSshPublicKey.trim()) return;

    // Generate simulated SHA256 fingerprint from input
    const randomHex = Array.from({ length: 22 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const fingerprint = `SHA256:${randomHex}`;

    const newKey: SshKeyItem = {
      id: `ssh-${Date.now()}`,
      title: newSshTitle.trim(),
      keyType: newSshKeyType,
      fingerprint,
      publicKey: newSshPublicKey.trim(),
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };

    setSshKeys(prev => [newKey, ...prev]);
    setShowAddSshModal(false);
    setNewSshTitle('');
    setNewSshPublicKey('');

    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action: 'SSH Public Key Registered',
      detail: `Added key "${newKey.title}" (${newKey.keyType})`,
      timestamp: 'Just now',
      ip: '192.168.1.42',
      status: 'info'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleDeleteSshKey = (keyId: string) => {
    const target = sshKeys.find(k => k.id === keyId);
    if (!target) return;
    if (window.confirm(`Remove SSH public key "${target.title}"?`)) {
      setSshKeys(prev => prev.filter(k => k.id !== keyId));
      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        action: 'SSH Public Key Deleted',
        detail: `Removed key "${target.title}"`,
        timestamp: 'Just now',
        ip: '192.168.1.42',
        status: 'warning'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  // Handle Test Webhook
  const handleSendTestWebhook = () => {
    setTestWebhookStatus('Sending payload...');
    setTimeout(() => {
      setTestWebhookStatus('200 OK: Delivered test security alert in 38ms');
      setTimeout(() => setTestWebhookStatus(null), 4000);
    }, 600);
  };

  // Revoke session
  const handleRevokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action: 'Session Terminated',
      detail: `Revoked access token for session ID ${id}`,
      timestamp: 'Just now',
      ip: '192.168.1.42',
      status: 'warning'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleRevokeAllOtherSessions = () => {
    if (window.confirm('Revoke all other active sessions?')) {
      setSessions(prev => prev.filter(s => s.isCurrent));
      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        action: 'All Other Sessions Terminated',
        detail: 'Forced sign-out across all external browsers and mobile clients',
        timestamp: 'Just now',
        ip: '192.168.1.42',
        status: 'warning'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  // Regenerate backup codes
  const handleRegenerateBackupCodes = () => {
    if (window.confirm('Regenerate backup codes? Previous codes will become invalid.')) {
      const generated = Array.from({ length: 8 }, () => {
        const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${p1}-${p2}`;
      });
      setAccount(prev => ({ ...prev, backupCodes: generated }));
      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        action: 'Backup Codes Regenerated',
        detail: 'Generated 8 fresh emergency recovery one-time passcodes',
        timestamp: 'Just now',
        ip: '192.168.1.42',
        status: 'warning'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Overview Header */}
      <div className="p-5 rounded-xl border border-neutral-900 bg-black flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white font-mono font-bold text-sm">
              AM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-mono font-semibold text-white tracking-tight">
                  {account.displayName}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono border border-neutral-800 bg-neutral-950 text-neutral-300">
                  {account.role}
                </span>
              </div>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">{account.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck size={13} className="text-white" />
              {account.twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
            </span>
            <span>&bull;</span>
            <span>Session Timeout: {account.sessionTimeoutMinutes}m</span>
            <span>&bull;</span>
            <span>API Tokens: {apiTokens.length} Active</span>
            <span>&bull;</span>
            <span>SSH Keys: {sshKeys.length} Registered</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto border-t md:border-t-0 border-neutral-900 pt-3 md:pt-0">
          <div className="px-3 py-1.5 rounded-lg bg-black border border-neutral-900 text-center font-mono">
            <div className="text-[10px] text-neutral-600 uppercase">Security</div>
            <div className="text-sm font-semibold text-white">
              {account.twoFactorEnabled ? '100%' : '65%'}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-black border border-neutral-900 text-center font-mono">
            <div className="text-[10px] text-neutral-600 uppercase">Sessions</div>
            <div className="text-sm font-semibold text-white">{sessions.length}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex items-center gap-2 border-b border-neutral-900 pb-2.5 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-950"
      >
        {[
          { id: 'security', label: 'Password & 2FA', icon: Lock },
          { id: 'email', label: 'Email & Details', icon: Mail },
          { id: 'tokens', label: 'API Keys & Tokens', icon: Key, badge: apiTokens.length },
          { id: 'ssh', label: 'SSH Public Keys', icon: Terminal, badge: sshKeys.length },
          { id: 'notifications', label: 'Alerts & Webhooks', icon: Bell },
          { id: 'sessions', label: 'Active Sessions', icon: Laptop, badge: sessions.length },
          { id: 'logs', label: 'Security Audit Log', icon: Clock }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all shrink-0 ${
                isActive
                  ? 'bg-neutral-900 text-white border border-neutral-800'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-950 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-neutral-600'} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PASSWORD & 2FA */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Change Password Card */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-black space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Lock size={15} className="text-neutral-400" />
                <h3 className="text-xs font-mono font-medium text-white uppercase tracking-wider">Change Password</h3>
              </div>
            </div>

            {passwordStatus.message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 font-mono ${
                  passwordStatus.type === 'success'
                    ? 'bg-neutral-950 border border-neutral-700 text-white'
                    : 'bg-neutral-950 border border-red-900 text-red-400'
                }`}
              >
                {passwordStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-900 text-white font-mono text-xs focus:outline-none focus:border-neutral-700 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 10 characters with symbols"
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-900 text-white font-mono text-xs focus:outline-none focus:border-neutral-700 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-400 block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-900 text-white font-mono text-xs focus:outline-none focus:border-neutral-700 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-mono font-medium transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* 2FA Card */}
          <div className="p-5 rounded-xl border border-neutral-900 bg-black space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-white" />
                <h3 className="text-xs font-mono font-medium text-white uppercase tracking-wider">
                  Two-Factor Authentication (2FA)
                </h3>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                  account.twoFactorEnabled
                    ? 'border-neutral-700 bg-neutral-900 text-white'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-500'
                }`}
              >
                {account.twoFactorEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <p className="text-xs font-mono text-neutral-400 leading-relaxed">
              Enforce cryptographic time-based one-time password (TOTP RFC-6238) verification using 1Password, Google Authenticator, or a hardware YubiKey.
            </p>

            <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Smartphone size={16} />
                </div>
                <div>
                  <div className="text-xs font-mono font-medium text-white">Authenticator App (TOTP)</div>
                  <div className="text-[11px] font-mono text-neutral-500">RFC-6238 SHA-256 token stream</div>
                </div>
              </div>

              {account.twoFactorEnabled ? (
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors"
                >
                  Disable
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShow2FAModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-mono font-medium transition-colors"
                >
                  Configure
                </button>
              )}
            </div>

            {/* Recovery Codes Section */}
            <div className="pt-2 border-t border-neutral-900 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-medium text-white">Emergency Recovery Codes</div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    One-time bypass passcodes in case of lost mobile authenticator.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateBackupCodes}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-300 hover:text-white transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Regenerate</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {account.backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-md bg-neutral-950 border border-neutral-900 text-center font-mono text-xs text-neutral-300 select-all"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(account.backupCodes.join('\n'));
                  setCopiedCodes(true);
                  setTimeout(() => setCopiedCodes(false), 2000);
                }}
                className="w-full py-2 rounded-lg border border-neutral-900 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2"
              >
                {copiedCodes ? <Check size={13} className="text-white" /> : <Copy size={13} />}
                <span>{copiedCodes ? 'Codes Copied to Clipboard' : 'Copy All 8 Backup Codes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL & DETAILS */}
      {activeTab === 'email' && (
        <div className="max-w-2xl p-5 rounded-xl border border-neutral-900 bg-black space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-neutral-400" />
              <h3 className="text-xs font-mono font-medium text-white uppercase tracking-wider">Update Email Address</h3>
            </div>
          </div>

          <p className="text-xs font-mono text-neutral-400">
            Current Primary Address: <span className="text-white font-medium">{account.email}</span>
          </p>

          {emailStatus.message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 font-mono ${
                emailStatus.type === 'success'
                  ? 'bg-neutral-950 border border-neutral-700 text-white'
                  : 'bg-neutral-950 border border-red-900 text-red-400'
              }`}
            >
              {emailStatus.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span>{emailStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleChangeEmail} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1.5">New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="operator@cluster.local"
                className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-900 text-white font-mono text-xs focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-neutral-400 block mb-1.5">
                Current Password (Verification)
              </label>
              <input
                type="password"
                value={emailPasswordVerification}
                onChange={e => setEmailPasswordVerification(e.target.value)}
                placeholder="Enter current password to authorize email transfer"
                className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-900 text-white font-mono text-xs focus:outline-none focus:border-neutral-700"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-mono font-medium transition-colors"
              >
                Save & Update Email
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: API KEYS & TOKENS */}
      {activeTab === 'tokens' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl border border-neutral-900 bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Key size={14} className="text-neutral-400" />
                Personal Access Tokens (PAT)
              </h3>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                API tokens authenticate programmatic access to cluster endpoints, deployment pipelines, and metrics exporters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreateTokenModal(true);
                setGeneratedTokenSecret(null);
              }}
              className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-mono font-medium transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <Plus size={14} />
              <span>Generate New Token</span>
            </button>
          </div>

          {/* Tokens List */}
          <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden divide-y divide-neutral-900">
            {apiTokens.map(tok => (
              <div key={tok.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-950/40 transition-colors">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-semibold text-white">{tok.name}</span>
                    <code className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                      {tok.prefix}
                    </code>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {tok.scopes.map(sc => (
                      <span key={sc} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                        {sc}
                      </span>
                    ))}
                    <span className="text-[11px] font-mono text-neutral-500">
                      Expires: <span className="text-neutral-400">{tok.expiresAt}</span>
                    </span>
                    <span className="text-neutral-600">&bull;</span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      Last used: <span className="text-neutral-400">{tok.lastUsed}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRevokeToken(tok.id)}
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 text-xs font-mono transition-colors"
                    title="Revoke Token"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* cURL Usage Code Card */}
          <div className="p-4 rounded-xl border border-neutral-900 bg-black space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-2">
                <Code size={14} />
                Example API Request (cURL)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`curl -H "Authorization: Bearer pat_live_YOUR_TOKEN" https://cluster.internal/api/v1/health`);
                  alert('Copied cURL snippet to clipboard.');
                }}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-900 text-[11px] font-mono text-neutral-300 overflow-x-auto select-all">
              curl -H "Authorization: Bearer pat_live_YOUR_TOKEN" https://cluster.internal/api/v1/health
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: SSH PUBLIC KEYS */}
      {activeTab === 'ssh' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl border border-neutral-900 bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal size={14} className="text-neutral-400" />
                Cluster Bastion SSH Keys
              </h3>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                Public keys authorized for secure shell access across node bastions and debug containers on port 22022.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddSshModal(true)}
              className="px-3.5 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-mono font-medium transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <Plus size={14} />
              <span>Add SSH Key</span>
            </button>
          </div>

          {/* SSH Keys List */}
          <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden divide-y divide-neutral-900">
            {sshKeys.map(key => (
              <div key={key.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-950/40 transition-colors">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <KeyRound size={14} className="text-neutral-400" />
                    <span className="text-xs font-mono font-semibold text-white">{key.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                      {key.keyType}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 truncate select-all">
                    Fingerprint: <span className="text-neutral-300">{key.fingerprint}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
                    <span>Added: {key.createdAt}</span>
                    <span>&bull;</span>
                    <span>Last used: {key.lastUsed}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(key.publicKey);
                      alert('Public key copied to clipboard.');
                    }}
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-mono transition-colors"
                    title="Copy Public Key"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSshKey(key.id)}
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 text-xs font-mono transition-colors"
                    title="Delete Key"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Bastion Connect Snippet */}
          <div className="p-4 rounded-xl border border-neutral-900 bg-black space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-2">
                <Terminal size={14} />
                Direct Bastion Login Command
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`ssh -i ~/.ssh/id_ed25519 admin@bastion.cluster.local -p 22022`);
                  alert('SSH connect command copied.');
                }}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <Copy size={12} /> Copy
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-900 text-[11px] font-mono text-neutral-300 overflow-x-auto select-all">
              ssh -i ~/.ssh/id_ed25519 admin@bastion.cluster.local -p 22022
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: ALERTS & WEBHOOKS */}
      {activeTab === 'notifications' && (
        <div className="max-w-3xl space-y-5">
          <div className="p-5 rounded-xl border border-neutral-900 bg-black space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-neutral-400" />
                <h3 className="text-xs font-mono font-medium text-white uppercase tracking-wider">
                  Security Alerts & Incident Notification
                </h3>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Email Alerts Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-900 bg-neutral-950">
                <div>
                  <div className="text-white font-medium">Critical Security Email Digests</div>
                  <div className="text-neutral-500 text-[11px]">Send immediate notices to {account.email}</div>
                </div>
                <input
                  type="checkbox"
                  checked={webhookConfig.emailAlerts}
                  onChange={e => setWebhookConfig(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                  className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-white accent-white cursor-pointer"
                />
              </div>

              {/* SMS Alerts Toggle */}
              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">SMS Emergency Pager Dispatch</div>
                    <div className="text-neutral-500 text-[11px]">Direct SMS dispatch for cluster down events</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={webhookConfig.smsAlerts}
                    onChange={e => setWebhookConfig(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                    className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-white accent-white cursor-pointer"
                  />
                </div>
                {webhookConfig.smsAlerts && (
                  <div>
                    <input
                      type="tel"
                      value={webhookConfig.phoneNumber}
                      onChange={e => setWebhookConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Webhook Endpoint */}
              <div className="p-3.5 rounded-lg border border-neutral-900 bg-neutral-950 space-y-3">
                <div>
                  <div className="text-white font-medium">PagerDuty / Slack Webhook URL</div>
                  <div className="text-neutral-500 text-[11px]">HTTP POST JSON payload with HMAC-SHA256 signature</div>
                </div>
                <input
                  type="url"
                  value={webhookConfig.webhookUrl}
                  onChange={e => setWebhookConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-white text-xs"
                />

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] text-neutral-400">Trigger Alert On:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookConfig.alertOnAuthFailure}
                        onChange={e => setWebhookConfig(prev => ({ ...prev, alertOnAuthFailure: e.target.checked }))}
                        className="accent-white"
                      />
                      <span>Auth Bursts</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookConfig.alertOnNodeDrain}
                        onChange={e => setWebhookConfig(prev => ({ ...prev, alertOnNodeDrain: e.target.checked }))}
                        className="accent-white"
                      />
                      <span>Node Failover</span>
                    </label>
                    <label className="flex items-center gap-2 text-[11px] text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookConfig.alertOnRoleEscalation}
                        onChange={e => setWebhookConfig(prev => ({ ...prev, alertOnRoleEscalation: e.target.checked }))}
                        className="accent-white"
                      />
                      <span>Role Escalation</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={handleSendTestWebhook}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white transition-colors"
                  >
                    <Send size={13} />
                    <span>Send Test Webhook</span>
                  </button>
                  {testWebhookStatus && (
                    <span className="text-[11px] text-emerald-400">{testWebhookStatus}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl border border-neutral-900 bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">Active Device Sessions</h3>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                Authorized browser environments and cryptographic JWT sessions currently holding elevated cluster clearance.
              </p>
            </div>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeAllOtherSessions}
                className="px-3.5 py-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <LogOut size={14} />
                <span>Sign Out Other Sessions</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden divide-y divide-neutral-900">
            {sessions.map(s => (
              <div
                key={s.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-950/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 mt-0.5">
                    <Laptop size={16} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-white">{s.device}</span>
                      {s.isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono border border-neutral-700 bg-neutral-900 text-white font-medium">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">{s.browser}</div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
                      <span>IP: {s.ip}</span>
                      <span>&bull;</span>
                      <span>{s.location}</span>
                      <span>&bull;</span>
                      <span className={s.isCurrent ? 'text-white' : 'text-neutral-500'}>{s.lastActive}</span>
                    </div>
                  </div>
                </div>

                {!s.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeSession(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs font-mono transition-colors self-end sm:self-center"
                  >
                    <Trash2 size={13} />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOG */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-neutral-900 bg-black flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">Personal Security Audit Log</h3>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                Immutable record of credentials rotated, sessions authorized, and tokens created.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500">{auditLogs.length} Records</span>
          </div>

          <div className="rounded-xl border border-neutral-900 bg-black overflow-hidden divide-y divide-neutral-900">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{log.action}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border ${
                        log.status === 'success'
                          ? 'border-neutral-700 bg-neutral-900 text-white'
                          : log.status === 'warning'
                          ? 'border-neutral-800 bg-neutral-950 text-neutral-300'
                          : 'border-neutral-900 bg-neutral-950 text-neutral-500'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px]">{log.detail}</div>
                </div>
                <div className="text-right text-[11px] text-neutral-500 shrink-0">
                  <div>{log.timestamp}</div>
                  <div className="text-neutral-600">{log.ip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl border border-neutral-800 bg-black space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-white" />
                <h3 className="text-sm font-semibold text-white">Setup Authenticator (TOTP)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShow2FAModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Scan the QR matrix with 1Password, Google Authenticator, or Authy, then enter the 6-digit code.
            </p>

            {/* Pure SVG QR Code representation */}
            <div className="flex justify-center p-4 bg-white rounded-xl mx-auto w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="5" y="5" width="25" height="25" rx="2" fill="#000" />
                <rect x="9" y="9" width="17" height="17" rx="1" fill="#fff" />
                <rect x="13" y="13" width="9" height="9" fill="#000" />

                <rect x="70" y="5" width="25" height="25" rx="2" fill="#000" />
                <rect x="74" y="9" width="17" height="17" rx="1" fill="#fff" />
                <rect x="78" y="13" width="9" height="9" fill="#000" />

                <rect x="5" y="70" width="25" height="25" rx="2" fill="#000" />
                <rect x="9" y="74" width="17" height="17" rx="1" fill="#fff" />
                <rect x="13" y="78" width="9" height="9" fill="#000" />

                <rect x="35" y="10" width="6" height="6" fill="#000" />
                <rect x="45" y="10" width="6" height="12" fill="#000" />
                <rect x="55" y="15" width="8" height="6" fill="#000" />
                <rect x="35" y="25" width="14" height="6" fill="#000" />
                <rect x="10" y="40" width="6" height="15" fill="#000" />
                <rect x="22" y="38" width="8" height="8" fill="#000" />
                <rect x="38" y="38" width="25" height="25" rx="2" fill="#000" />
                <rect x="44" y="44" width="13" height="13" fill="#fff" />
                <rect x="48" y="48" width="5" height="5" fill="#000" />
                <rect x="70" y="38" width="8" height="14" fill="#000" />
                <rect x="85" y="42" width="10" height="8" fill="#000" />
                <rect x="70" y="60" width="14" height="6" fill="#000" />
                <rect x="36" y="72" width="10" height="10" fill="#000" />
                <rect x="52" y="70" width="12" height="14" fill="#000" />
                <rect x="72" y="75" width="20" height="8" fill="#000" />
                <rect x="85" y="88" width="10" height="6" fill="#000" />
              </svg>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 p-2 bg-neutral-950 border border-neutral-900 rounded-lg">
                <code className="text-[11px] text-neutral-300 flex-1 text-center select-all">
                  HXDM 7J2K 99LX 42QA
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('HXDM7J2K99LX42QA');
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-white"
                >
                  {copiedSecret ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-neutral-500">6-Digit Verification Code</label>
              <div className="flex justify-between gap-1">
                {totpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`totp-input-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const next = [...totpCode];
                      next[index] = val;
                      setTotpCode(next);
                      if (val && index < 5) {
                        const nextEl = document.getElementById(`totp-input-${index + 1}`);
                        nextEl?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !totpCode[index] && index > 0) {
                        const prevEl = document.getElementById(`totp-input-${index - 1}`);
                        prevEl?.focus();
                      }
                    }}
                    className="w-10 h-10 text-center text-sm font-bold bg-neutral-950 border border-neutral-800 rounded-lg focus:outline-none focus:border-white"
                  />
                ))}
              </div>
              {totpError && <p className="text-[10px] text-red-400">{totpError}</p>}
            </div>

            <button
              type="button"
              onClick={handleVerifyTOTP}
              className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Check size={14} />
              <span>Verify & Activate 2FA</span>
            </button>
          </div>
        </div>
      )}

      {/* GENERATE TOKEN MODAL */}
      {showCreateTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-neutral-800 bg-black space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-white" />
                <h3 className="text-sm font-semibold text-white">Generate Personal Access Token</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateTokenModal(false);
                  setGeneratedTokenSecret(null);
                }}
                className="text-neutral-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            {generatedTokenSecret ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-neutral-700 bg-neutral-950 text-xs text-neutral-300">
                  <span className="text-white font-bold block mb-1">Make sure to copy your token now.</span>
                  You won't be able to view it again.
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                  <div className="text-[11px] font-mono text-neutral-200 break-all select-all font-semibold">
                    {generatedTokenSecret}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTokenSecret);
                      setCopiedNewToken(true);
                      setTimeout(() => setCopiedNewToken(false), 2000);
                    }}
                    className="w-full py-2 rounded bg-white text-black hover:bg-neutral-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    {copiedNewToken ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedNewToken ? 'Token Copied!' : 'Copy Token to Clipboard'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTokenModal(false);
                    setGeneratedTokenSecret(null);
                  }}
                  className="w-full py-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-white"
                >
                  I have saved my token
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTokenSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Token Name</label>
                  <input
                    type="text"
                    required
                    value={newTokenName}
                    onChange={e => setNewTokenName(e.target.value)}
                    placeholder="e.g. k8s-node-orchestrator"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Expiration</label>
                  <select
                    value={newTokenExpiry}
                    onChange={e => setNewTokenExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs cursor-pointer"
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year (365 days)</option>
                    <option value="0">Never (Infinite)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-neutral-400 block">Select Scopes</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'cluster:read', label: 'cluster:read (View cluster stats)' },
                      { id: 'nodes:write', label: 'nodes:write (Drain and reboot nodes)' },
                      { id: 'storage:manage', label: 'storage:manage (Create volumes & snapshots)' },
                      { id: 'network:read', label: 'network:read (View interface VIPs)' },
                      { id: 'metrics:export', label: 'metrics:export (Prometheus scraping)' }
                    ].map(sc => (
                      <label key={sc.id} className="flex items-center gap-2 p-2 rounded bg-neutral-950 border border-neutral-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTokenScopes.includes(sc.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewTokenScopes(prev => [...prev, sc.id]);
                            } else {
                              setNewTokenScopes(prev => prev.filter(x => x !== sc.id));
                            }
                          }}
                          className="accent-white"
                        />
                        <span className="text-neutral-300 text-[11px] truncate">{sc.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                  >
                    Generate Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD SSH KEY MODAL */}
      {showAddSshModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-neutral-800 bg-black space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-white" />
                <h3 className="text-sm font-semibold text-white">Add SSH Public Key</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSshModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSshKeySubmit} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Key Name / Identifier</label>
                <input
                  type="text"
                  required
                  value={newSshTitle}
                  onChange={e => setNewSshTitle(e.target.value)}
                  placeholder="e.g. Workstation Arch Linux (id_ed25519)"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Algorithm</label>
                <select
                  value={newSshKeyType}
                  onChange={e => setNewSshKeyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs cursor-pointer"
                >
                  <option value="ED25519">ED25519 (Recommended)</option>
                  <option value="ED25519-SK">ED25519-SK (Hardware Security Key)</option>
                  <option value="RSA-4096">RSA (4096-bit)</option>
                  <option value="ECDSA-SHA2">ECDSA NIST P-256</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Public Key Data</label>
                <textarea
                  required
                  rows={4}
                  value={newSshPublicKey}
                  onChange={e => setNewSshPublicKey(e.target.value)}
                  placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... user@machine"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs font-mono"
                />
                <span className="text-[10px] text-neutral-500 block mt-1">
                  Begins with 'ssh-ed25519', 'ssh-rsa', 'ecdsa-sha2-nistp256', or 'sk-ssh-ed25519'.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold"
                >
                  Add SSH Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
