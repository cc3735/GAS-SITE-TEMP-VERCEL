/**
 * Client Management Page (GAS Admin Only)
 * 
 * Allows GAS admins to:
 * - View all client organizations
 * - Assign/revoke business app access
 * - Convert leads to clients
 * - Manage client subscriptions
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    Users,
    Building2,
    Plus,
    Search,
    Check,
    X,
    Loader2,
    GraduationCap,
    Scale,
    Key,
    Utensils,
    HardHat,
    ToggleLeft,
    ToggleRight,
    UserPlus,
    Mail,
    Calendar,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    slug: string;
    is_client: boolean;
    subscription_tier: string;
    subscription_status: string;
    created_at: string;
    owner_user_id: string | null;
}

interface BusinessApp {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    status: string;
}

interface ClientSubscription {
    id: string;
    organization_id: string;
    app_id: string;
    is_active: boolean;
    billing_cycle: string | null;
    started_at: string;
    expires_at: string | null;
}

interface LeadContact {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string;
    phone: string | null;
    lead_status: string;
    lead_score: number;
    custom_fields: {
        service_interest?: string;
        company?: string;
    };
    created_at: string;
}

const APP_ICONS: Record<string, React.ReactNode> = {
    'keys-open-doors': <Key className="w-5 h-5" />,
    'food-truck': <Utensils className="w-5 h-5" />,
    'construction-mgmt': <HardHat className="w-5 h-5" />,
    'courseflow': <GraduationCap className="w-5 h-5" />,
    'legalflow': <Scale className="w-5 h-5" />,
};

export default function ClientManagement() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [apps, setApps] = useState<BusinessApp[]>([]);
    const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
    const [leads, setLeads] = useState<LeadContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLeads, setShowLeads] = useState(false);
    const [convertingLead, setConvertingLead] = useState<string | null>(null);

    // Check if user is GAS admin
    const isGasAdmin = user?.email?.endsWith('@gasweb.info');

    useEffect(() => {
        if (isGasAdmin) {
            fetchData();
        }
    }, [isGasAdmin]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch client organizations
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('is_client', true)
                .order('created_at', { ascending: false });

            if (orgError) throw orgError;

            // Fetch all business apps
            const { data: appData, error: appError } = await supabase
                .from('business_apps')
                .select('*')
                .eq('status', 'active');

            if (appError) throw appError;

            // Fetch all client subscriptions
            const { data: subData, error: subError } = await supabase
                .from('client_subscriptions')
                .select('*');

            if (subError) throw subError;

            // Fetch leads (for conversion)
            const { data: leadData, error: leadError } = await supabase
                .from('contacts')
                .select('*')
                .in('lead_status', ['new', 'qualified', 'proposal'])
                .order('lead_score', { ascending: false })
                .limit(50);

            if (leadError) throw leadError;

            setOrganizations(orgData || []);
            setApps(appData || []);
            setSubscriptions(subData || []);
            setLeads(leadData || []);
        } catch (error: any) {
            addToast?.('error', 'Failed to load data');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAppAccess = async (orgId: string, appId: string, currentlyActive: boolean) => {
        try {
            const existingSub = subscriptions.find(
                s => s.organization_id === orgId && s.app_id === appId
            );

            if (existingSub) {
                // Update existing subscription
                await supabase
                    .from('client_subscriptions')
                    .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
                    .eq('id', existingSub.id);
            } else {
                // Create new subscription
                await supabase.from('client_subscriptions').insert({
                    organization_id: orgId,
                    app_id: appId,
                    is_active: true,
                    assigned_by: user?.id,
                });
            }

            addToast?.('success', currentlyActive ? 'App access revoked' : 'App access granted');

            fetchData();
        } catch (error: any) {
            addToast?.('error', 'Failed to update access');
        }
    };

    const convertLeadToClient = async (contact: LeadContact) => {
        try {
            setConvertingLead(contact.id);

            // Create new client organization
            const orgName = contact.custom_fields?.company || `${contact.first_name}'s Organization`;
            const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const { error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: orgName,
                    slug: orgSlug + '-' + Date.now(),
                    is_client: true,
                    parent_organization_id: 'a0000000-0000-0000-0000-000000000001', // GAS org
                    subscription_tier: 'basic',
                    subscription_status: 'active',
                    service_interests: [contact.custom_fields?.service_interest || 'general'],
                })
                .select()
                .single();

            if (orgError) throw orgError;

            // Update contact status
            await supabase
                .from('contacts')
                .update({ lead_status: 'customer' })
                .eq('id', contact.id);

            addToast?.('success', `${orgName} created as client`);
            setShowLeads(false);
            fetchData();
        } catch (error: any) {
            addToast?.('error', 'Failed to convert lead');
            console.error('Error:', error);
        } finally {
            setConvertingLead(null);
        }
    };

    const getOrgSubscriptions = (orgId: string) => {
        return subscriptions.filter(s => s.organization_id === orgId);
    };

    const hasAppAccess = (orgId: string, appId: string) => {
        const sub = subscriptions.find(
            s => s.organization_id === orgId && s.app_id === appId
        );
        return sub?.is_active || false;
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isGasAdmin) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
                    <p className="text-gray-500 mt-2">
                        This page is only accessible to GAS administrators.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                    <p className="text-gray-600 mt-1">
                        Manage client organizations and their app access
                    </p>
                </div>
                <button
                    onClick={() => setShowLeads(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <UserPlus className="w-4 h-4" />
                    Convert Lead to Client
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
                            <p className="text-sm text-gray-500">Client Organizations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {subscriptions.filter(s => s.is_active).length}
                            </p>
                            <p className="text-sm text-gray-500">Active Subscriptions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                            <p className="text-sm text-gray-500">Pending Leads</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Key className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{apps.length}</p>
                            <p className="text-sm text-gray-500">Available Apps</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Client List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Client Organizations</h2>
                </div>

                {filteredOrgs.length === 0 ? (
                    <div className="p-8 text-center">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No client organizations found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Convert leads to clients to see them here
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredOrgs.map((org) => (
                            <div key={org.id} className="p-6">
                                <div
                                    onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                                    className="flex items-center justify-between cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{org.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>Joined {new Date(org.created_at).toLocaleDateString()}</span>
                                                <span className="mx-2">•</span>
                                                <span className="capitalize">{org.subscription_tier} tier</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                            {getOrgSubscriptions(org.id).filter(s => s.is_active).length} / {apps.length} apps
                                        </span>
                                        {expandedOrg === org.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded App Access */}
                                {expandedOrg === org.id && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-medium text-gray-700 mb-4">App Access</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {apps.map((app) => {
                                                const hasAccess = hasAppAccess(org.id, app.id);
                                                return (
                                                    <div
                                                        key={app.id}
                                                        className={`p-4 rounded-lg border ${hasAccess
                                                            ? 'border-green-200 bg-green-50'
                                                            : 'border-gray-200 bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="p-2 rounded-lg"
                                                                    style={{ backgroundColor: app.color + '20', color: app.color }}
                                                                >
                                                                    {APP_ICONS[app.slug] || <Key className="w-5 h-5" />}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{app.name}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {hasAccess ? 'Active' : 'Not subscribed'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleAppAccess(org.id, app.id, hasAccess);
                                                                }}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                {hasAccess ? (
                                                                    <ToggleRight className="w-8 h-8 text-green-500" />
                                                                ) : (
                                                                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lead Conversion Modal */}
            {showLeads && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Convert Lead to Client</h2>
                            <button onClick={() => setShowLeads(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {leads.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No leads available for conversion</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {leads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {lead.first_name} {lead.last_name}
                                                    </h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {lead.email}
                                                        </span>
                                                        {lead.custom_fields?.service_interest && (
                                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                                                {lead.custom_fields.service_interest}
                                                            </span>
                                                        )}
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                                            Score: {lead.lead_score}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => convertLeadToClient(lead)}
                                                    disabled={convertingLead === lead.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {convertingLead === lead.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Plus className="w-4 h-4" />
                                                    )}
                                                    Convert
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
