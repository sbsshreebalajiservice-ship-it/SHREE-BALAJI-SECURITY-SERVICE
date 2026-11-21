import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Layers,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
} from 'lucide-react';
import type {
  AdminAuthStatus,
  InquiryItem,
  InquiryStatus,
  ServiceItem,
  SiteData,
} from '../types';

interface AdminPanelProps {
  siteData: SiteData;
  token: string;
  onAuthSuccess: (newToken: string) => void;
  onLogout: () => void;
  onSiteDataUpdated: (next: SiteData) => void;
  onNavigate: (path: string) => void;
}

type AdminTab = 'inquiries' | 'settings' | 'services';
type StatusFilter = 'All' | InquiryStatus;

const IMAGE_PRESETS = [
  { label: 'Manned Guarding', value: '/src/assets/images/service_manned_guarding_1795262487636.jpg' },
  { label: 'CCTV Control Room', value: '/src/assets/images/service_cctv_surveillance_1795262486918.jpg' },
  { label: 'Corporate Lobby', value: '/src/assets/images/hero_security_command_1795262486785.jpg' },
  { label: 'Event & VIP Team', value: '/src/assets/images/service_corporate_event_1795262486631.jpg' },
];

export function AdminPanel({
  siteData,
  token,
  onAuthSuccess,
  onLogout,
  onSiteDataUpdated,
  onNavigate,
}: AdminPanelProps) {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('inquiries');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inquiries state
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [inqLoading, setInqLoading] = useState(false);
  const [inqError, setInqError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Settings form state
  const [draftSite, setDraftSite] = useState<SiteData>(siteData);
  const [aboutPointsText, setAboutPointsText] = useState(siteData.aboutPoints.join('\n'));
  const [savingSettings, setSavingSettings] = useState(false);

  // Services form state
  const [newCategory, setNewCategory] = useState('Specialized Security');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState(IMAGE_PRESETS[0].value);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editServiceDraft, setEditServiceDraft] = useState<ServiceItem | null>(null);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    setDraftSite(siteData);
    setAboutPointsText(siteData.aboutPoints.join('\n'));
  }, [siteData]);

  useEffect(() => {
    let cancelled = false;
    async function checkStatus() {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/admin/auth-status');
        const json = (await res.json()) as AdminAuthStatus;
        if (!cancelled) setAuthStatus(json);
      } catch {
        if (!cancelled) setAuthError('Unable to reach server authentication endpoint.');
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadInquiries = async (currentToken: string) => {
    setInqLoading(true);
    setInqError('');
    try {
      const res = await fetch('/api/admin/inquiries', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const json = (await res.json()) as { success?: boolean; data?: InquiryItem[]; error?: string };
      if (!res.ok || !json.success) {
        setInqError(json.error || 'Failed to load inquiries.');
      } else {
        setInquiries(json.data || []);
      }
    } catch {
      setInqError('Network error while loading inquiries.');
    } finally {
      setInqLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadInquiries(token);
    }
  }, [token]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const isSetup = authStatus?.mode === 'unclaimed';
    if (isSetup && password.length < 6) {
      setAuthError('Please choose a password of at least 6 characters.');
      return;
    }
    if (isSetup && password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const endpoint = isSetup ? '/api/admin/setup' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json()) as { success?: boolean; token?: string; error?: string };
      if (res.ok && json.success && json.token) {
        setPassword('');
        setConfirmPassword('');
        setAuthStatus({ configured: true, mode: isSetup ? 'claimed' : authStatus?.mode || 'claimed' });
        onAuthSuccess(json.token);
      } else {
        setAuthError(json.error || 'Authentication failed.');
      }
    } catch {
      setAuthError('Network error while signing in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: number, status: InquiryStatus) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (!res.ok) {
        showNotice('error', 'Failed to update status.');
        return;
      }
      setInquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      showNotice('success', 'Inquiry status updated.');
    } catch {
      showNotice('error', 'Network error updating status.');
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (!res.ok) {
        showNotice('error', 'Failed to delete inquiry.');
        return;
      }
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      setConfirmDeleteId(null);
      showNotice('success', 'Inquiry removed.');
    } catch {
      showNotice('error', 'Network error removing inquiry.');
    }
  };

  const pushSiteUpdate = async (nextSite: SiteData, successMessage: string) => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/site', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nextSite),
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const json = (await res.json()) as { success?: boolean; data?: SiteData; error?: string };
      if (res.ok && json.success && json.data) {
        onSiteDataUpdated(json.data);
        showNotice('success', successMessage);
      } else {
        showNotice('error', json.error || 'Failed to save changes.');
      }
    } catch {
      showNotice('error', 'Network error while saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    const parsedPoints = aboutPointsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payload: SiteData = {
      ...draftSite,
      aboutPoints: parsedPoints.length > 0 ? parsedPoints : siteData.aboutPoints,
    };
    await pushSiteUpdate(payload, 'Website settings saved.');
  };

  const handleAddService = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const nextServices: ServiceItem[] = [
      ...siteData.services,
      {
        id: Date.now(),
        category: newCategory.trim() || 'Security Service',
        title: newTitle.trim(),
        desc: newDesc.trim(),
        imageUrl: newImageUrl.trim() || IMAGE_PRESETS[0].value,
      },
    ];

    await pushSiteUpdate({ ...siteData, services: nextServices }, 'New service added.');
    setNewTitle('');
    setNewDesc('');
  };

  const handleSaveServiceEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editServiceDraft) return;
    const nextServices = siteData.services.map((srv) =>
      srv.id === editServiceDraft.id ? editServiceDraft : srv
    );
    await pushSiteUpdate({ ...siteData, services: nextServices }, 'Service updated.');
    setEditingServiceId(null);
    setEditServiceDraft(null);
  };

  const handleRemoveService = async (id: number) => {
    if (siteData.services.length <= 1) {
      showNotice('error', 'At least one service must remain listed.');
      return;
    }
    const nextServices = siteData.services.filter((srv) => srv.id !== id);
    await pushSiteUpdate({ ...siteData, services: nextServices }, 'Service removed.');
  };

  const filteredInquiries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inquiries.filter((item) => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [inquiries, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: inquiries.length,
      pending: inquiries.filter((i) => i.status === 'Pending').length,
      contacted: inquiries.filter((i) => i.status === 'Contacted').length,
      completed: inquiries.filter((i) => i.status === 'Completed').length,
    };
  }, [inquiries]);

  if (!token) {
    const isUnclaimed = authStatus?.mode === 'unclaimed';

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-md bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-slate-900">
                {isUnclaimed ? 'Set Up Admin Password' : 'Admin Sign In'}
              </h1>
              <p className="text-xs text-slate-500">{siteData.companyName} Operations Console</p>
            </div>
          </div>

          {authLoading ? (
            <div className="py-8 text-sm text-slate-500 text-center">Checking admin access status...</div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isUnclaimed && (
                <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
                  Create your administrator password to claim this panel. Setting{' '}
                  <code className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded">ADMIN_PASSWORD</code>{' '}
                  in Railway Variables overrides this anytime.
                </p>
              )}

              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  {isUnclaimed ? 'New Admin Password' : 'Admin Password'}
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isUnclaimed ? 'Minimum 6 characters' : 'Enter your password'}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              {isUnclaimed && (
                <div>
                  <label
                    htmlFor="admin-confirm-password"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="admin-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              )}

              {authError && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
              >
                {authSubmitting
                  ? 'Verifying...'
                  : isUnclaimed
                    ? 'Claim Admin Access'
                    : 'Sign In to Dashboard'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Return to Public Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabLabels: Record<AdminTab, string> = {
    inquiries: 'Inquiries',
    settings: 'Website Settings',
    services: 'Manage Services',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-slate-950 text-slate-200 border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-800">
          <Shield className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-display font-bold text-white text-base truncate">
            {siteData.companyName}
          </span>
        </div>

        <nav aria-label="Admin sections" className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-slate-800 text-amber-400'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FileText className="w-4 h-4" />
              <span>Inquiries</span>
            </span>
            <span className="font-mono tabular-nums text-xs text-slate-400">{counts.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-amber-400'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Website Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'services'
                ? 'bg-slate-800 text-amber-400'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Services</span>
            </span>
            <span className="font-mono tabular-nums text-xs text-slate-400">
              {siteData.services.length}
            </span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
          <div className="text-sm text-slate-500 flex items-center gap-2 truncate">
            <span>Admin</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900">{tabLabels[activeTab]}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View Live Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {toast && (
            <div
              role="status"
              className={`mb-6 p-3.5 rounded-md border flex items-center gap-2.5 text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{toast.text}</span>
            </div>
          )}

          {/* Tab 1: Inquiries */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Requests', val: counts.total },
                  { label: 'Pending', val: counts.pending },
                  { label: 'Contacted', val: counts.contacted },
                  { label: 'Completed', val: counts.completed },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="bg-white border border-slate-200 rounded-lg p-4"
                  >
                    <div className="text-xs text-slate-500 font-medium">{metric.label}</div>
                    <div className="font-mono tabular-nums text-2xl font-semibold text-slate-900 mt-1">
                      {metric.val}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search name, phone, service..."
                        className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md w-60 focus:outline-none focus:border-slate-900"
                      />
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                      {(['All', 'Pending', 'Contacted', 'Completed'] as StatusFilter[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            statusFilter === st
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadInquiries(token)}
                    disabled={inqLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${inqLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {inqError ? (
                  <div className="p-8 text-center text-sm text-red-700">{inqError}</div>
                ) : inqLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((row) => (
                      <div key={row} className="h-10 bg-slate-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : filteredInquiries.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      {inquiries.length === 0
                        ? 'No quote requests received yet.'
                        : 'No inquiries match your current search or filter.'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted requests from the public quote form will appear here immediately.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[760px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Client</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">Requirement</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {filteredInquiries.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                              {new Date(item.created_at).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                            <td className="py-3 px-4">
                              <div className="font-mono tabular-nums text-xs text-slate-900">
                                {item.phone}
                              </div>
                              <div className="text-xs text-slate-500">{item.email}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">{item.service}</td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {item.message || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                aria-label={`Status for ${item.name}`}
                                value={item.status}
                                onChange={(e) =>
                                  handleUpdateInquiryStatus(item.id, e.target.value as InquiryStatus)
                                }
                                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {confirmDeleteId === item.id ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteInquiry(item.id)}
                                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Company & Website Settings */}
          {activeTab === 'settings' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-8"
            >
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Company & Website Content
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Changes saved here update the public website immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSite.companyName}
                    onChange={(e) => setDraftSite({ ...draftSite, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Company Tagline
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSite.companyTag}
                    onChange={(e) => setDraftSite({ ...draftSite, companyTag: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSite.phone}
                    onChange={(e) => setDraftSite({ ...draftSite, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={draftSite.email}
                    onChange={(e) => setDraftSite({ ...draftSite, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Office Address
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSite.address}
                    onChange={(e) => setDraftSite({ ...draftSite, address: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="font-display text-base font-semibold text-slate-900">Hero Banner</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSite.heroTitle}
                    onChange={(e) => setDraftSite({ ...draftSite, heroTitle: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Hero Subtitle
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={draftSite.heroSubtitle}
                    onChange={(e) => setDraftSite({ ...draftSite, heroSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Key Statistics Strip
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 1 Number</label>
                    <input
                      type="text"
                      value={draftSite.stat1Num}
                      onChange={(e) => setDraftSite({ ...draftSite, stat1Num: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono tabular-nums mb-2"
                    />
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 1 Label</label>
                    <input
                      type="text"
                      value={draftSite.stat1Label}
                      onChange={(e) => setDraftSite({ ...draftSite, stat1Label: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 2 Number</label>
                    <input
                      type="text"
                      value={draftSite.stat2Num}
                      onChange={(e) => setDraftSite({ ...draftSite, stat2Num: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono tabular-nums mb-2"
                    />
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 2 Label</label>
                    <input
                      type="text"
                      value={draftSite.stat2Label}
                      onChange={(e) => setDraftSite({ ...draftSite, stat2Label: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 3 Number</label>
                    <input
                      type="text"
                      value={draftSite.stat3Num}
                      onChange={(e) => setDraftSite({ ...draftSite, stat3Num: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono tabular-nums mb-2"
                    />
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 3 Label</label>
                    <input
                      type="text"
                      value={draftSite.stat3Label}
                      onChange={(e) => setDraftSite({ ...draftSite, stat3Label: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 4 Number</label>
                    <input
                      type="text"
                      value={draftSite.stat4Num}
                      onChange={(e) => setDraftSite({ ...draftSite, stat4Num: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono tabular-nums mb-2"
                    />
                    <label className="block text-xs font-medium text-slate-600 mb-1">Stat 4 Label</label>
                    <input
                      type="text"
                      value={draftSite.stat4Label}
                      onChange={(e) => setDraftSite({ ...draftSite, stat4Label: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  About Us & Compliance Points
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    About Section Heading
                  </label>
                  <input
                    type="text"
                    required
                    value={draftSite.aboutTitle}
                    onChange={(e) => setDraftSite({ ...draftSite, aboutTitle: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    About Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={draftSite.aboutDesc}
                    onChange={(e) => setDraftSite({ ...draftSite, aboutDesc: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Compliance & Trust Points (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={aboutPointsText}
                    onChange={(e) => setAboutPointsText(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
                >
                  {savingSettings ? 'Saving...' : 'Save Website Settings'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Manage Services */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddService}
                className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
              >
                <h2 className="font-display text-lg font-bold text-slate-900">Add New Service</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      required
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g. Industrial Security"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Service Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Dog Squad & Perimeter"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Photo Preset
                    </label>
                    <select
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                    >
                      {IMAGE_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Service Description *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Describe deployment scope, verification standards, and coverage..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </button>
              </form>

              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
                <div className="p-5">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Active Services ({siteData.services.length})
                  </h3>
                </div>

                {siteData.services.map((srv, index) => (
                  <div key={srv.id} className="p-5">
                    {editingServiceId === srv.id && editServiceDraft ? (
                      <form onSubmit={handleSaveServiceEdit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Category
                            </label>
                            <input
                              type="text"
                              required
                              value={editServiceDraft.category}
                              onChange={(e) =>
                                setEditServiceDraft({ ...editServiceDraft, category: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              required
                              value={editServiceDraft.title}
                              onChange={(e) =>
                                setEditServiceDraft({ ...editServiceDraft, title: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Photo Preset
                            </label>
                            <select
                              value={editServiceDraft.imageUrl}
                              onChange={(e) =>
                                setEditServiceDraft({ ...editServiceDraft, imageUrl: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
                            >
                              {IMAGE_PRESETS.map((preset) => (
                                <option key={preset.value} value={preset.value}>
                                  {preset.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={editServiceDraft.desc}
                              onChange={(e) =>
                                setEditServiceDraft({ ...editServiceDraft, desc: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={savingSettings}
                            className="px-4 py-2 bg-slate-950 text-white text-xs font-semibold rounded-md cursor-pointer"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingServiceId(null);
                              setEditServiceDraft(null);
                            }}
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-md cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500 font-medium">
                            <span className="font-mono tabular-nums">
                              {String(index + 1).padStart(2, '0')}
                            </span>{' '}
                            · {srv.category}
                          </div>
                          <h4 className="font-display font-bold text-slate-900">{srv.title}</h4>
                          <p className="text-sm text-slate-600 max-w-2xl">{srv.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingServiceId(srv.id);
                              setEditServiceDraft(srv);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(srv.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
