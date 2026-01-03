import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { 
  Loader2, 
  Building2, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Shield,
  Users
} from 'lucide-react';

type SetupMode = 'choose' | 'create' | 'invitation';

interface InvitationDetails {
  id: string;
  organization_name: string;
  inviter_email: string;
  role: string;
  expires_at: string;
}

export default function OrganizationSetup() {
  const { user } = useAuth();
  const { refetchOrganizations, error: orgError } = useOrganization();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode] = useState<SetupMode>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create organization form
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });
  
  // Invitation handling
  const [invitationToken, setInvitationToken] = useState('');
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [validatingInvitation, setValidatingInvitation] = useState(false);

  // Check for invitation token in URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setInvitationToken(token);
      setMode('invitation');
      validateInvitation(token);
    }
  }, [searchParams]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: generateSlug(name),
    });
  };

  const validateInvitation = async (token: string) => {
    setValidatingInvitation(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          role,
          expires_at,
          organizations!inner(name),
          inviter:invited_by(email)
        `)
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError || !data) {
        setError('Invalid or expired invitation. Please contact the person who invited you.');
        setInvitationDetails(null);
        return;
      }

      setInvitationDetails({
        id: data.id,
        organization_name: (data.organizations as any)?.name || 'Unknown Organization',
        inviter_email: (data.inviter as any)?.email || 'Unknown',
        role: data.role,
        expires_at: data.expires_at,
      });
    } catch (err) {
      console.error('Error validating invitation:', err);
      setError('Failed to validate invitation. Please try again.');
    } finally {
      setValidatingInvitation(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user || !invitationDetails) return;

    setLoading(true);
    setError(null);

    try {
      // Get the invitation to get the organization_id
      const { data: invitation, error: invError } = await supabase
        .from('organization_invitations')
        .select('organization_id, role')
        .eq('id', invitationDetails.id)
        .single();

      if (invError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Create organization membership
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role,
        });

      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error('You are already a member of this organization');
        }
        throw memberError;
      }

      // Mark invitation as accepted
      await supabase
        .from('organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitationDetails.id);

      setSuccess(`Successfully joined ${invitationDetails.organization_name}!`);
      
      // Wait a moment then redirect
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refetchOrganizations();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Try to use the RPC function first
      const { data: orgId, error: rpcError } = await supabase.rpc('create_new_organization', {
        org_name: formData.name,
        org_slug: formData.slug,
      });

      if (rpcError) {
        // Fallback to direct insert if RPC doesn't exist
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            slug: formData.slug,
            subscription_tier: 'free',
            subscription_status: 'active',
            is_master: false,
            config: {
              can_view_unified_inbox: false,
              can_view_business_apps: true,
              can_view_ai_agents: true,
              can_view_mcp_servers: true,
              can_view_analytics: true,
              can_view_crm: false,
              pii_masking_enabled: true,
            },
          })
          .select()
          .single();

        if (orgError) throw orgError;

        // Add user as owner
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: org.id,
            user_id: user.id,
            role: 'owner',
          });

        if (memberError) throw memberError;

        // Create default workspace
        await supabase
          .from('workspaces')
          .insert({
            organization_id: org.id,
            name: 'General',
            is_default: true,
            created_by: user.id,
          });
      }

      setSuccess('Organization created successfully!');
      
      // Wait a moment for the trigger to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refetchOrganizations();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error creating organization:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInvitation = async () => {
    if (!invitationToken.trim()) {
      setError('Please enter an invitation code');
      return;
    }
    await validateInvitation(invitationToken.trim());
  };

  // Render different modes
  const renderChooseMode = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Your Workspace</h1>
        <p className="text-gray-600 text-lg">
          Get started by creating a new organization or joining an existing one
        </p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => setMode('create')}
          className="group w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <Sparkles className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Create New Organization</h3>
              <p className="text-gray-500 text-sm">
                Start fresh with your own workspace. Perfect for teams or solo users.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
          </div>
        </button>

        <button
          onClick={() => setMode('invitation')}
          className="group w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
              <Mail className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Join with Invitation</h3>
              <p className="text-gray-500 text-sm">
                Have an invitation code? Enter it here to join an existing organization.
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors mt-1" />
          </div>
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-500">
          Need help? Contact your administrator or{' '}
          <a href="mailto:support@gasweb.info" className="text-blue-600 hover:underline">
            reach out to support
          </a>
        </p>
      </div>
    </div>
  );

  const renderCreateMode = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Organization</h1>
        <p className="text-gray-600">
          Set up your workspace to start collaborating
        </p>
      </div>

      <form onSubmit={handleCreateOrganization} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            placeholder="Acme Inc."
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            URL Identifier
          </label>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">workspace/</span>
            <input
              type="text"
              id="slug"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
              placeholder="acme-inc"
              pattern="[a-z0-9-]+"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Only lowercase letters, numbers, and hyphens
          </p>
        </div>

        {/* Features preview */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Your organization will include:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>AI-powered automation tools</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Team collaboration features</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Analytics and reporting</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name || !formData.slug}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderInvitationMode = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join an Organization</h1>
        <p className="text-gray-600">
          Enter your invitation code to join an existing team
        </p>
      </div>

      {!invitationDetails ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="invitation-code" className="block text-sm font-medium text-gray-700 mb-2">
              Invitation Code
            </label>
            <input
              type="text"
              id="invitation-code"
              value={invitationToken}
              onChange={(e) => setInvitationToken(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none transition font-mono"
              placeholder="Enter your invitation code..."
            />
            <p className="text-xs text-gray-500 mt-1">
              The invitation code was sent to you via email
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('choose');
                setError(null);
                setInvitationToken('');
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleCheckInvitation}
              disabled={validatingInvitation || !invitationToken.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validatingInvitation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Validating...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{invitationDetails.organization_name}</h3>
                <p className="text-sm text-gray-500">Organization</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Invited by: <strong>{invitationDetails.inviter_email}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Your role: <strong className="capitalize">{invitationDetails.role}</strong></span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setInvitationDetails(null);
                setInvitationToken('');
                setError(null);
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAcceptInvitation}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                'Accept & Join'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {mode === 'choose' && renderChooseMode()}
          {mode === 'create' && renderCreateMode()}
          {mode === 'invitation' && renderInvitationMode()}
        </div>
        
        {orgError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{orgError}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
