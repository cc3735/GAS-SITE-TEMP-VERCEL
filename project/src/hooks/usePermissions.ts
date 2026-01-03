import { useMemo } from 'react';
import { useOrganization, OrganizationConfig } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export interface Permissions {
  // Role-based permissions
  isGlobalAdmin: boolean;
  isOrgAdmin: boolean;
  isOrgOwner: boolean;
  isMember: boolean;
  isViewer: boolean;
  
  // Master org specific
  isMasterOrgMember: boolean;
  isMasterAdmin: boolean;
  isImpersonating: boolean;
  
  // Feature visibility (from org config)
  canViewUnifiedInbox: boolean;
  canViewBusinessApps: boolean;
  canViewAiAgents: boolean;
  canViewMcpServers: boolean;
  canConfigureMcpServers: boolean; // GAS admin only - full CRUD on MCP servers
  canViewAnalytics: boolean;
  canViewCrm: boolean;
  piiMaskingEnabled: boolean;
  
  // Derived action permissions
  canManageOrganization: boolean;
  canManageMembers: boolean;
  canManageProjects: boolean;
  canImpersonateOrgs: boolean;
  canViewAllOrgs: boolean;
  canAccessGasAdmin: boolean;
}

const defaultPermissions: Permissions = {
  isGlobalAdmin: false,
  isOrgAdmin: false,
  isOrgOwner: false,
  isMember: false,
  isViewer: false,
  isMasterOrgMember: false,
  isMasterAdmin: false,
  isImpersonating: false,
  canViewUnifiedInbox: false,
  canViewBusinessApps: false,
  canViewAiAgents: false,
  canViewMcpServers: false,
  canConfigureMcpServers: false,
  canViewAnalytics: false,
  canViewCrm: false,
  piiMaskingEnabled: true,
  canManageOrganization: false,
  canManageMembers: false,
  canManageProjects: false,
  canImpersonateOrgs: false,
  canViewAllOrgs: false,
  canAccessGasAdmin: false,
};

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const {
    currentOrganization,
    effectiveOrganization,
    memberRole,
    isMasterContext,
    impersonatedOrganizationId,
    organizations,
  } = useOrganization();

  return useMemo(() => {
    if (!user || !currentOrganization) {
      return defaultPermissions;
    }

    const role = memberRole || 'viewer';
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin' || isOwner;
    const isMember = role === 'member' || isAdmin;
    const isViewer = role === 'viewer' || isMember;

    // Check if user is in the master org
    const masterOrg = organizations.find(o => o.is_master);
    const isMasterOrgMember = masterOrg !== undefined && organizations.some(o => o.id === masterOrg.id);
    const isMasterAdmin = isMasterContext && isAdmin;

    // Get config from effective organization (or current if not impersonating)
    const config: OrganizationConfig = effectiveOrganization?.config || currentOrganization.config || {
      can_view_unified_inbox: false,
      can_view_business_apps: true,
      can_view_ai_agents: true,
      can_view_mcp_servers: true,
      can_view_analytics: true,
      can_view_crm: false,
      pii_masking_enabled: true,
    };

    // When master admin is impersonating, respect the config restrictions
    const isImpersonating = impersonatedOrganizationId !== null;
    
    // Feature visibility - master admins are subject to config restrictions
    const canViewUnifiedInbox = isMasterAdmin 
      ? config.can_view_unified_inbox 
      : true; // Regular org members can always view their own inbox
    
    // Business Apps is GAS admin only feature - clients cannot see it
    const canViewBusinessApps = isMasterAdmin && config.can_view_business_apps;
    
    const canViewAiAgents = isMasterAdmin 
      ? config.can_view_ai_agents 
      : true;
    
    const canViewMcpServers = isMasterAdmin 
      ? config.can_view_mcp_servers 
      : true;
    
    // Only GAS admins can configure MCP servers (add/edit/delete)
    // Regular users can only toggle servers on/off in Mission Control
    const canConfigureMcpServers = isMasterAdmin && !isImpersonating;
    
    const canViewAnalytics = isMasterAdmin 
      ? config.can_view_analytics 
      : true;
    
    const canViewCrm = isMasterAdmin 
      ? config.can_view_crm 
      : true;

    return {
      // Role-based
      isGlobalAdmin: isMasterAdmin,
      isOrgAdmin: isAdmin,
      isOrgOwner: isOwner,
      isMember,
      isViewer,
      
      // Master org
      isMasterOrgMember,
      isMasterAdmin,
      isImpersonating,
      
      // Feature visibility
      canViewUnifiedInbox,
      canViewBusinessApps,
      canViewAiAgents,
      canViewMcpServers,
      canConfigureMcpServers,
      canViewAnalytics,
      canViewCrm,
      piiMaskingEnabled: config.pii_masking_enabled,
      
      // Action permissions
      canManageOrganization: isAdmin,
      canManageMembers: isAdmin,
      canManageProjects: isMember,
      canImpersonateOrgs: isMasterAdmin,
      canViewAllOrgs: isMasterAdmin,
      canAccessGasAdmin: isMasterAdmin,
    };
  }, [
    user,
    currentOrganization,
    effectiveOrganization,
    memberRole,
    isMasterContext,
    impersonatedOrganizationId,
    organizations,
  ]);
}

// Helper hook to get the effective organization (considering impersonation)
export function useEffectiveOrganization() {
  const { effectiveOrganization, currentOrganization, impersonatedOrganizationId } = useOrganization();
  
  return {
    organization: effectiveOrganization || currentOrganization,
    isImpersonating: impersonatedOrganizationId !== null,
    actualOrganization: currentOrganization,
  };
}

