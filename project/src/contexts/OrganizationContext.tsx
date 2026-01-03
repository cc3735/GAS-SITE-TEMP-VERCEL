import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Organization configuration for master admin visibility
export interface OrganizationConfig {
  can_view_unified_inbox: boolean;
  can_view_business_apps: boolean;
  can_view_ai_agents: boolean;
  can_view_mcp_servers: boolean;
  can_view_analytics: boolean;
  can_view_crm: boolean;
  pii_masking_enabled: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  subscription_tier: string;
  subscription_status: string;
  is_master: boolean;
  domain_restriction: string | null;
  owner_user_id: string | null;
  config: OrganizationConfig;
  settings: Record<string, unknown>;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface BusinessApp {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  status: string;
  config: Record<string, unknown>;
  repo_path: string | null;
}

interface OrganizationContextType {
  // Core state
  organizations: Organization[];
  currentOrganization: Organization | null;
  memberRole: string | null;
  loading: boolean;
  error: string | null;
  
  // Master org & impersonation
  isMasterContext: boolean;
  impersonatedOrganizationId: string | null;
  effectiveOrganization: Organization | null;
  allOrganizations: Organization[]; // For master admin - all orgs
  
  // Business apps
  businessApps: BusinessApp[];
  
  // Actions
  switchOrganization: (orgId: string) => void;
  setImpersonatedOrganization: (orgId: string | null) => void;
  refetchOrganizations: () => Promise<void>;
  createOrganization: (name: string, slug?: string) => Promise<Organization | null>;
}

const defaultConfig: OrganizationConfig = {
  can_view_unified_inbox: false,
  can_view_business_apps: true,
  can_view_ai_agents: true,
  can_view_mcp_servers: true,
  can_view_analytics: true,
  can_view_crm: false,
  pii_masking_enabled: true,
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  // Core state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Impersonation state
  const [impersonatedOrganizationId, setImpersonatedOrgId] = useState<string | null>(null);
  
  // Business apps
  const [businessApps, setBusinessApps] = useState<BusinessApp[]>([]);

  // Derived state
  const isMasterContext = currentOrganization?.is_master === true;
  
  // Effective organization (considering impersonation)
  const effectiveOrganization = impersonatedOrganizationId
    ? allOrganizations.find(o => o.id === impersonatedOrganizationId) || currentOrganization
    : currentOrganization;

  const createDefaultOrganization = async (): Promise<Organization | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    const orgName = 'My Organization';
    const orgSlug = `org-${Math.random().toString(36).substring(2, 9)}`;

    try {
      setError(null);
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgSlug,
          subscription_tier: 'free',
          subscription_status: 'active',
          is_master: false,
          config: defaultConfig,
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        setError(`Failed to create organization: ${orgError.message}`);
        throw orgError;
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding user to organization:', memberError);
        setError(`Failed to add user to organization: ${memberError.message}`);
        throw memberError;
      }

      const { error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          organization_id: org.id,
          name: 'General',
          is_default: true,
          created_by: user.id
        });

      if (workspaceError) {
        console.warn('Workspace creation warning:', workspaceError);
        // Don't throw - workspace is not critical
      }

      setError(null);
      return org;
    } catch (error: any) {
      console.error('Error creating default organization:', error);
      setError(error?.message || 'Failed to create organization. Please try again.');
      return null;
    }
  };

  const createOrganization = async (name: string, slug?: string): Promise<Organization | null> => {
    if (!user) return null;

    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name,
          slug: orgSlug,
          subscription_tier: 'free',
          subscription_status: 'active',
          is_master: false,
          config: defaultConfig,
          owner_user_id: user.id,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      const { error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          organization_id: org.id,
          name: 'General',
          is_default: true,
          created_by: user.id
        });

      if (workspaceError) {
        console.warn('Workspace creation warning:', workspaceError);
      }

      // Refresh organizations list
      await fetchOrganizations();
      
      return org;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  const fetchBusinessApps = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('business_apps')
        .select('*')
        .eq('organization_id', orgId);

      if (error) throw error;
      setBusinessApps(data || []);
    } catch (error) {
      console.error('Error fetching business apps:', error);
      setBusinessApps([]);
    }
  };

  const fetchAllOrganizations = async () => {
    // This is for master admins to see all orgs
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllOrganizations(data?.map(org => ({
        ...org,
        config: org.config || defaultConfig,
      })) || []);
    } catch (error) {
      console.error('Error fetching all organizations:', error);
    }
  };

  const fetchOrganizations = async () => {
    if (authLoading) return;

    if (!user) {
      console.log('Organization: No user, resetting state');
      setOrganizations([]);
      setAllOrganizations([]);
      setCurrentOrganization(null);
      setBusinessApps([]);
      setError(null);
      setLoading(false);
      return;
    }

    console.log('Organization: Fetching organizations for user:', user.id);
    setError(null);

    try {
      let { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id);

      console.log('Organization: Member query result:', { memberData, memberError });

      if (memberError) {
        console.error('Error fetching organization memberships:', memberError);
        setError(`Failed to fetch organizations: ${memberError.message}`);
        throw memberError;
      }

      // If user has no organization membership, check for domain auto-join
      if (!memberData || memberData.length === 0) {
        console.log('Organization: User has no organization memberships, checking domain auto-join');
        
        // Get user's email domain
        const emailDomain = user.email?.split('@')[1];
        
        if (emailDomain) {
          // Check for organization with matching domain auto-join
          const { data: autoJoinOrg } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('domain_auto_join_enabled', true)
            .contains('allowed_domains', [emailDomain])
            .single();
          
          if (autoJoinOrg) {
            console.log('Organization: Found auto-join org:', autoJoinOrg.name);
            
            // Create membership for user
            const { error: joinError } = await supabase
              .from('organization_members')
              .insert({
                organization_id: autoJoinOrg.id,
                user_id: user.id,
                role: 'member'
              });
            
            if (!joinError) {
              console.log('Organization: Auto-joined user to:', autoJoinOrg.name);
              
              // Refetch memberships
              const { data: newMemberData } = await supabase
                .from('organization_members')
                .select('organization_id, role')
                .eq('user_id', user.id);
              
              memberData = newMemberData;
            } else {
              console.warn('Organization: Failed to auto-join:', joinError);
            }
          }
        }
        
        // If still no memberships, redirect to setup
        if (!memberData || memberData.length === 0) {
          console.log('Organization: User has no organization memberships');
          setOrganizations([]);
          setCurrentOrganization(null);
          setLoading(false);
          return;
        }
      }

      const orgIds = memberData.map(m => m.organization_id);
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgsError) throw orgsError;

      // Parse and normalize organization data
      const normalizedOrgs: Organization[] = (orgsData || []).map(org => ({
        ...org,
        config: org.config || defaultConfig,
        is_master: org.is_master || false,
      }));

      setOrganizations(normalizedOrgs);

      // Check if user is a master admin
      const masterOrg = normalizedOrgs.find(o => o.is_master);
      const masterMember = masterOrg ? memberData.find(m => m.organization_id === masterOrg.id) : null;
      const isMasterAdmin = masterMember && ['owner', 'admin'].includes(masterMember.role);

      // If master admin, fetch all organizations
      if (isMasterAdmin) {
        await fetchAllOrganizations();
      } else {
        setAllOrganizations(normalizedOrgs);
      }

      // Set current organization
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      let currentOrg = savedOrgId
        ? normalizedOrgs.find(o => o.id === savedOrgId)
        : null;

      if (!currentOrg && normalizedOrgs.length > 0) {
        currentOrg = normalizedOrgs[0];
      }

      if (currentOrg) {
        setCurrentOrganization(currentOrg);
        const member = memberData.find(m => m.organization_id === currentOrg!.id);
        setMemberRole(member?.role || null);
        localStorage.setItem('currentOrganizationId', currentOrg.id);

        // Fetch business apps for effective org
        await fetchBusinessApps(currentOrg.id);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      setError(error?.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user, authLoading]);

  // Fetch business apps when effective organization changes
  useEffect(() => {
    if (effectiveOrganization) {
      fetchBusinessApps(effectiveOrganization.id);
    }
  }, [effectiveOrganization?.id]);

  const switchOrganization = useCallback((orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      // Check domain restriction
      if (org.domain_restriction && user?.email) {
        const emailDomain = user.email.split('@')[1];
        if (emailDomain !== org.domain_restriction) {
          console.error(`Cannot switch to organization: email domain ${emailDomain} does not match ${org.domain_restriction}`);
          return;
        }
      }

      setCurrentOrganization(org);
      setImpersonatedOrgId(null); // Clear impersonation when switching
      localStorage.setItem('currentOrganizationId', orgId);

      supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user!.id)
        .maybeSingle()
        .then(({ data }) => {
          setMemberRole(data?.role || null);
        });
    }
  }, [organizations, user]);

  const setImpersonatedOrganization = useCallback((orgId: string | null) => {
    // Only master admins can impersonate
    if (!isMasterContext && orgId !== null) {
      console.error('Only master organization admins can impersonate other organizations');
      return;
    }
    setImpersonatedOrgId(orgId);
    
    // Clear impersonation from localStorage when exiting
    if (orgId === null) {
      localStorage.removeItem('impersonatedOrgId');
    } else {
      localStorage.setItem('impersonatedOrgId', orgId);
    }
  }, [isMasterContext]);

  const refetchOrganizations = async () => {
    setLoading(true);
    await fetchOrganizations();
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        memberRole,
        loading,
        error,
        isMasterContext,
        impersonatedOrganizationId,
        effectiveOrganization,
        allOrganizations,
        businessApps,
        switchOrganization,
        setImpersonatedOrganization,
        refetchOrganizations,
        createOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
