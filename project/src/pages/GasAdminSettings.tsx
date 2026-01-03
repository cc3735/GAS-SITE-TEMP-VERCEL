import React, { useState, useMemo } from 'react';
import {
  Shield,
  Crown,
  Building2,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Inbox,
  Boxes,
  Bot,
  Server,
  BarChart2,
  Users,
  Lock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useOrganization, Organization, OrganizationConfig } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
import { supabase } from '../lib/supabase';

interface VisibilityToggleProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  label,
  description,
  icon,
  enabled,
  onChange,
  disabled = false,
}) => (
  <div className={`flex items-start justify-between p-4 bg-surface-hover rounded-lg ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex items-start gap-3">
      <div className="p-2 bg-surface rounded-lg">
        {icon}
      </div>
      <div>
        <p className="font-medium text-primary">{label}</p>
        <p className="text-sm text-subtle">{description}</p>
      </div>
    </div>
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-accent' : 'bg-border'
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

interface OrgConfigCardProps {
  org: Organization & { domain_auto_join_enabled?: boolean; allowed_domains?: string[] };
  onSave: (orgId: string, config: OrganizationConfig) => Promise<void>;
  onSaveDomainSettings: (orgId: string, enabled: boolean, domains: string[]) => Promise<void>;
}

const OrgConfigCard: React.FC<OrgConfigCardProps> = ({ org, onSave, onSaveDomainSettings }) => {
  const [config, setConfig] = useState<OrganizationConfig>(org.config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDomainSettings, setShowDomainSettings] = useState(false);
  const [domainAutoJoinEnabled, setDomainAutoJoinEnabled] = useState(org.domain_auto_join_enabled || false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(org.allowed_domains || []);
  const [newDomain, setNewDomain] = useState('');
  const [domainSaving, setDomainSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(org.id, config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDomainSettings = async () => {
    setDomainSaving(true);
    try {
      await onSaveDomainSettings(org.id, domainAutoJoinEnabled, allowedDomains);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setDomainSaving(false);
    }
  };

  const handleAddDomain = () => {
    if (newDomain && !allowedDomains.includes(newDomain.toLowerCase())) {
      setAllowedDomains([...allowedDomains, newDomain.toLowerCase()]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domain));
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(org.config);
  const hasDomainChanges = domainAutoJoinEnabled !== (org.domain_auto_join_enabled || false) ||
    JSON.stringify(allowedDomains) !== JSON.stringify(org.allowed_domains || []);

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-subtle rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">{org.name}</h3>
            <p className="text-xs text-subtle">{org.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-accent-foreground text-sm rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm text-subtle mb-4">
          Configure what GAS admins can see when viewing this organization:
        </p>

        <VisibilityToggle
          label="Unified Inbox"
          description="View customer conversations and messages"
          icon={<Inbox className="w-5 h-5 text-secondary" />}
          enabled={config.can_view_unified_inbox}
          onChange={(enabled) => setConfig({ ...config, can_view_unified_inbox: enabled })}
        />

        <VisibilityToggle
          label="Business Apps"
          description="View and manage business applications"
          icon={<Boxes className="w-5 h-5 text-secondary" />}
          enabled={config.can_view_business_apps}
          onChange={(enabled) => setConfig({ ...config, can_view_business_apps: enabled })}
        />

        <VisibilityToggle
          label="AI Agents"
          description="View agent configurations and status"
          icon={<Bot className="w-5 h-5 text-secondary" />}
          enabled={config.can_view_ai_agents}
          onChange={(enabled) => setConfig({ ...config, can_view_ai_agents: enabled })}
        />

        <VisibilityToggle
          label="MCP Servers"
          description="View MCP server connections and status"
          icon={<Server className="w-5 h-5 text-secondary" />}
          enabled={config.can_view_mcp_servers}
          onChange={(enabled) => setConfig({ ...config, can_view_mcp_servers: enabled })}
        />

        <VisibilityToggle
          label="Analytics"
          description="View performance metrics and reports"
          icon={<BarChart2 className="w-5 h-5 text-secondary" />}
          enabled={config.can_view_analytics}
          onChange={(enabled) => setConfig({ ...config, can_view_analytics: enabled })}
        />

        <VisibilityToggle
          label="CRM Data"
          description="View customer and contact information"
          icon={<Users className="w-5 h-5 text-secondary" />}
          enabled={config.can_view_crm}
          onChange={(enabled) => setConfig({ ...config, can_view_crm: enabled })}
        />

        <div className="border-t border-border pt-3 mt-4">
          <VisibilityToggle
            label="PII Masking"
            description="Mask personal identifiable information when viewing"
            icon={<Lock className="w-5 h-5 text-amber-500" />}
            enabled={config.pii_masking_enabled}
            onChange={(enabled) => setConfig({ ...config, pii_masking_enabled: enabled })}
          />
        </div>

        {/* Domain Auto-Join Settings */}
        <div className="border-t border-border pt-4 mt-4">
          <button
            onClick={() => setShowDomainSettings(!showDomainSettings)}
            className="w-full flex items-center justify-between p-3 bg-surface-hover rounded-lg hover:bg-border transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface rounded-lg">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-primary">Domain Auto-Join</p>
                <p className="text-sm text-subtle">
                  {domainAutoJoinEnabled 
                    ? `Enabled for ${allowedDomains.length} domain(s)` 
                    : 'Disabled'}
                </p>
              </div>
            </div>
            {showDomainSettings ? (
              <ChevronUp className="w-5 h-5 text-subtle" />
            ) : (
              <ChevronDown className="w-5 h-5 text-subtle" />
            )}
          </button>

          {showDomainSettings && (
            <div className="mt-3 p-4 bg-surface-hover rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Enable Domain Auto-Join</p>
                  <p className="text-xs text-subtle">Users with matching email domains will auto-join this organization</p>
                </div>
                <button
                  onClick={() => setDomainAutoJoinEnabled(!domainAutoJoinEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    domainAutoJoinEnabled ? 'bg-green-500' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      domainAutoJoinEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {domainAutoJoinEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Allowed Domains</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="example.com"
                        className="flex-1 px-3 py-2 border border-border bg-surface text-primary rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                      />
                      <button
                        onClick={handleAddDomain}
                        disabled={!newDomain}
                        className="px-3 py-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-sm transition disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {allowedDomains.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {allowedDomains.map(domain => (
                        <span
                          key={domain}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 text-sm rounded"
                        >
                          @{domain}
                          <button
                            onClick={() => handleRemoveDomain(domain)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {hasDomainChanges && (
                <button
                  onClick={handleSaveDomainSettings}
                  disabled={domainSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition disabled:opacity-50"
                >
                  {domainSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Domain Settings
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function GasAdminSettings() {
  const { allOrganizations, refetchOrganizations } = useOrganization();
  const permissions = usePermissions();
  const [globalSaving, setGlobalSaving] = useState(false);

  // Filter out master org
  const tenantOrgs = useMemo(() => 
    allOrganizations.filter(org => !org.is_master),
    [allOrganizations]
  );

  const handleSaveOrgConfig = async (orgId: string, config: OrganizationConfig) => {
    const { error } = await supabase
      .from('organizations')
      .update({ config })
      .eq('id', orgId);

    if (error) {
      console.error('Error saving config:', error);
      throw error;
    }

    // Refresh organizations to get updated config
    await refetchOrganizations();
  };

  const handleSaveDomainSettings = async (orgId: string, enabled: boolean, domains: string[]) => {
    const { error } = await supabase
      .from('organizations')
      .update({ 
        domain_auto_join_enabled: enabled,
        allowed_domains: domains 
      })
      .eq('id', orgId);

    if (error) {
      console.error('Error saving domain settings:', error);
      throw error;
    }

    await refetchOrganizations();
  };

  // Apply same config to all orgs
  const handleApplyToAll = async (config: Partial<OrganizationConfig>) => {
    setGlobalSaving(true);
    try {
      for (const org of tenantOrgs) {
        const newConfig = { ...org.config, ...config };
        await supabase
          .from('organizations')
          .update({ config: newConfig })
          .eq('id', org.id);
      }
      await refetchOrganizations();
    } finally {
      setGlobalSaving(false);
    }
  };

  // Redirect if not master admin
  if (!permissions.isMasterAdmin) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">Access Denied</h1>
          <p className="text-secondary">You must be a GAS admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">GAS Admin Settings</h1>
            <p className="text-sm text-subtle">Configure visibility and permissions for tenant organizations</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        {/* Info Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-primary font-medium">Privacy & Access Control</p>
            <p className="text-sm text-secondary mt-1">
              These settings control what GAS administrators can see when viewing or impersonating tenant organizations.
              Disabled features will be hidden from the admin view to protect customer privacy.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="bg-surface rounded-lg border border-border p-4 mb-6">
          <h2 className="text-sm font-semibold text-primary mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyToAll({ can_view_unified_inbox: false })}
              disabled={globalSaving}
              className="flex items-center gap-2 px-3 py-2 bg-surface-hover hover:bg-border text-sm text-primary rounded border border-border transition"
            >
              <EyeOff className="w-4 h-4" />
              Disable Inbox for All
            </button>
            <button
              onClick={() => handleApplyToAll({ pii_masking_enabled: true })}
              disabled={globalSaving}
              className="flex items-center gap-2 px-3 py-2 bg-surface-hover hover:bg-border text-sm text-primary rounded border border-border transition"
            >
              <Lock className="w-4 h-4" />
              Enable PII Masking for All
            </button>
            <button
              onClick={() => handleApplyToAll({
                can_view_business_apps: true,
                can_view_ai_agents: true,
                can_view_mcp_servers: true,
                can_view_analytics: true,
              })}
              disabled={globalSaving}
              className="flex items-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-sm text-accent rounded border border-accent/20 transition"
            >
              <Eye className="w-4 h-4" />
              Enable All Service Views
            </button>
            {globalSaving && <Loader2 className="w-5 h-5 animate-spin text-accent ml-2" />}
          </div>
        </div>

        {/* Organization Config Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-primary">Per-Organization Settings</h2>
          {tenantOrgs.length > 0 ? (
            tenantOrgs.map(org => (
              <OrgConfigCard
                key={org.id}
                org={org as any}
                onSave={handleSaveOrgConfig}
                onSaveDomainSettings={handleSaveDomainSettings}
              />
            ))
          ) : (
            <div className="bg-surface rounded-lg border border-border p-12 text-center">
              <Building2 className="w-12 h-12 text-subtle mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No Tenant Organizations</h3>
              <p className="text-secondary">No tenant organizations have been created yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

