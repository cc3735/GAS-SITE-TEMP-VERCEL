import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  MessageCircle,
  Megaphone,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  Edit2,
  Calendar,
  Clock,
  Send,
  Inbox,
  Share2,
  Target,
  Sparkles,
  Heart,
  ShoppingCart,
  X,
  Loader2,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useContacts } from '../../hooks/useContacts';

type TabType = 'crm' | 'messages' | 'marketing';
type MarketingSubTab = 'campaigns' | 'social';

type CampaignTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  metrics: {
    estimatedOpens: string;
    estimatedClicks: string;
    sendTime: string;
  };
};

const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'welcome-series',
    name: 'Welcome Series',
    description: '5-email automated welcome flow',
    category: 'Onboarding',
    icon: Sparkles,
    color: 'bg-blue-500',
    metrics: { estimatedOpens: '35-45%', estimatedClicks: '8-12%', sendTime: 'Immediate + 3, 7, 14, 21 days' },
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Build anticipation for new features',
    category: 'Announcements',
    icon: Target,
    color: 'bg-green-500',
    metrics: { estimatedOpens: '28-38%', estimatedClicks: '12-18%', sendTime: '2 weeks before, 1 week before, launch day' },
  },
  {
    id: 're-engagement',
    name: 'Re-engagement',
    description: 'Win back inactive subscribers',
    category: 'Nurture',
    icon: Heart,
    color: 'bg-purple-500',
    metrics: { estimatedOpens: '22-32%', estimatedClicks: '6-10%', sendTime: '30 days of inactivity' },
  },
  {
    id: 'promotional',
    name: 'Promotional Sale',
    description: 'Drive conversions with special offers',
    category: 'Sales',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    metrics: { estimatedOpens: '40-50%', estimatedClicks: '15-25%', sendTime: 'Immediately after signup' },
  },
  {
    id: 'educational',
    name: 'Educational Content',
    description: 'Share valuable tips and resources',
    category: 'Content',
    icon: Send,
    color: 'bg-indigo-500',
    metrics: { estimatedOpens: '25-35%', estimatedClicks: '10-15%', sendTime: 'Weekly, Friday morning' },
  },
  {
    id: 'seasonal',
    name: 'Seasonal Campaign',
    description: 'Holiday and seasonal messaging',
    category: 'Events',
    icon: Calendar,
    color: 'bg-pink-500',
    metrics: { estimatedOpens: '30-40%', estimatedClicks: '12-18%', sendTime: 'Date-specific triggers' },
  },
];

export default function PortalCRM() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab: TabType = tabParam === 'messages' ? 'messages' : tabParam === 'marketing' ? 'marketing' : 'crm';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { contacts, loading, createContact, updateContact, deleteContact } = useContacts();

  // CRM state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewContact, setShowNewContact] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [showEditContact, setShowEditContact] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', title: '', company_name: '', date_of_birth: '', notes: '',
  });
  const [editFormData, setEditFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', title: '', company_name: '', date_of_birth: '', notes: '',
  });

  // Marketing state
  const [marketingSubTab, setMarketingSubTab] = useState<MarketingSubTab>('campaigns');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '', subject: '', description: '', audience: '', sendDate: '', templateId: '',
  });

  // Contact helpers
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || contact.lead_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-50 text-blue-700',
      qualified: 'bg-green-50 text-green-700',
      unqualified: 'bg-slate-100 text-slate-600',
      contacted: 'bg-yellow-50 text-yellow-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-600';
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    if (cleaned.length === 11 && cleaned.startsWith('1')) return `+1 ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return phone;
  };

  const getLastCorrespondenceDate = (contactId: string) => {
    const hash = contactId.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const daysAgo = Math.abs(hash) % 30;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.abs(hash) % 24);
    date.setMinutes(Math.abs(hash) % 60);
    return date;
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return;
    setCreating(true);
    try {
      const contact = await createContact(formData);
      if (contact) {
        setFormData({ first_name: '', last_name: '', email: '', phone: '', title: '', company_name: '', date_of_birth: '', notes: '' });
        setShowNewContact(false);
      } else {
        alert('Failed to create contact. Please make sure you have an organization set up.');
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      alert('Failed to create contact: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !editFormData.first_name.trim()) return;
    setUpdating(true);
    try {
      await updateContact(editingContact.id, editFormData);
      setShowEditContact(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Failed to update contact:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignForm({
      name: `${template.name} Campaign`,
      subject: `Default ${template.name} subject line`,
      description: template.description,
      audience: 'All subscribers',
      sendDate: new Date().toISOString().split('T')[0],
      templateId: template.id,
    });
    setShowCampaignModal(true);
  };

  const handleCreateCampaign = () => {
    alert(`Campaign "${campaignForm.name}" created using ${selectedTemplate?.name} template!`);
    setShowCampaignModal(false);
    setSelectedTemplate(null);
    setCampaignForm({ name: '', subject: '', description: '', audience: '', sendDate: '', templateId: '' });
  };

  // Loading
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // No organization
  if (!currentOrganization) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">CRM</h1>
        <p className="text-slate-500 text-sm mb-8">Manage contacts, messages, and marketing.</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Set Up Your Business</h3>
          <p className="text-slate-500 mb-6">Create an organization to start managing contacts, messages, and marketing campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
          <p className="text-slate-500 text-sm mt-1">Manage contacts, messages, and marketing in one place.</p>
        </div>
        {activeTab === 'crm' && (
          <button
            onClick={() => setShowNewContact(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New Contact
          </button>
        )}
        {activeTab === 'marketing' && marketingSubTab === 'campaigns' && (
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('crm')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'crm'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            CRM
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'messages'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Unified Messaging
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'marketing'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Megaphone className="w-4 h-4 inline mr-2" />
            Marketing & Social
          </button>
        </nav>
      </div>

      {/* ========== CRM Tab ========== */}
      {activeTab === 'crm' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl">
              {/* Search & Filter */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-slate-900 placeholder-slate-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white text-slate-900"
                    >
                      <option value="all">All Status</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="unqualified">Unqualified</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Table */}
              {filteredContacts.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {contacts.length === 0 ? 'No contacts yet' : 'No contacts found'}
                  </h3>
                  <p className="text-slate-500 mb-4">
                    {contacts.length === 0 ? 'Add your first contact to get started' : 'Try adjusting your search or filters'}
                  </p>
                  {contacts.length === 0 && (
                    <button
                      onClick={() => setShowNewContact(true)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition"
                    >
                      Add Your First Contact
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Contact</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredContacts.map((contact) => (
                        <tr
                          key={contact.id}
                          onClick={() => {
                            setEditingContact(contact);
                            setEditFormData({
                              first_name: contact.first_name,
                              last_name: contact.last_name || '',
                              email: contact.email || '',
                              phone: contact.phone || '',
                              title: contact.title || '',
                              company_name: contact.company_name || '',
                              date_of_birth: contact.date_of_birth || '',
                              notes: contact.notes || '',
                            });
                            setShowEditContact(true);
                          }}
                          className="hover:bg-slate-50 cursor-pointer transition"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm mr-3">
                                {contact.first_name.charAt(0)}
                                {contact.last_name?.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-900">
                                  {contact.first_name} {contact.last_name}
                                </div>
                                {contact.title && (
                                  <div className="text-xs text-slate-500">{contact.title}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-700 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-slate-400" />
                              {contact.company_name || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-700 flex items-center gap-2">
                              {contact.email ? (
                                <><Mail className="w-4 h-4 text-slate-400" />{contact.email}</>
                              ) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-700 flex items-center gap-2">
                              {contact.phone ? (
                                <><Phone className="w-4 h-4 text-slate-400" />{formatPhoneNumber(contact.phone)}</>
                              ) : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {getLastCorrespondenceDate(contact.id).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.lead_status)}`}>
                              {contact.lead_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingContact(contact);
                                  setEditFormData({
                                    first_name: contact.first_name,
                                    last_name: contact.last_name || '',
                                    email: contact.email || '',
                                    phone: contact.phone || '',
                                    title: contact.title || '',
                                    company_name: contact.company_name || '',
                                    date_of_birth: contact.date_of_birth || '',
                                    notes: contact.notes || '',
                                  });
                                  setShowEditContact(true);
                                }}
                                className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50 transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete contact ${contact.first_name}${contact.last_name ? ' ' + contact.last_name : ''}?`)) {
                                    deleteContact(contact.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========== Unified Messaging Tab ========== */}
      {activeTab === 'messages' && (
        <div className="bg-white border border-slate-200 rounded-2xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-8 h-8 text-primary-600" />
              <h2 className="text-2xl font-bold text-slate-900">Unified Messages</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Channels */}
              <div className="lg:col-span-1">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-4">Communication Channels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-slate-200">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-slate-900">Email</div>
                        <div className="text-sm text-slate-500">12 unread</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-slate-200">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium text-slate-900">SMS</div>
                        <div className="text-sm text-slate-500">3 unread</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-slate-200">
                      <Send className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-slate-900">Social DMs</div>
                        <div className="text-sm text-slate-500">8 unread</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded border border-slate-200">
                      <Inbox className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="font-medium text-slate-900">Forms</div>
                        <div className="text-sm text-slate-500">5 unread</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="lg:col-span-2">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Recent Communications</h3>
                    <select className="px-3 py-1 text-sm border border-slate-300 rounded bg-white text-slate-900">
                      <option>All Contacts</option>
                      <option>Unanswered</option>
                      <option>This Week</option>
                    </select>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {contacts.slice(0, 6).map((contact, index) => (
                      <div key={contact.id} className="bg-white rounded-lg border border-slate-200 p-4 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs">
                              {contact.first_name.charAt(0)}
                              {contact.last_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900">
                                  {contact.first_name} {contact.last_name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  index % 3 === 0 ? 'bg-blue-50 text-blue-700' :
                                  index % 3 === 1 ? 'bg-green-50 text-green-700' :
                                  'bg-orange-50 text-orange-700'
                                }`}>
                                  {index % 3 === 0 ? 'Email' : index % 3 === 1 ? 'SMS' : 'Social'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-2">
                                {index % 3 === 0 ? 'Following up on our conversation about AI solutions...' :
                                 index % 3 === 1 ? 'Thanks for your interest! Here are more details...' :
                                 'Check out our latest campaign on LinkedIn!'}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                {getLastCorrespondenceDate(contact.id).toLocaleDateString()} at {getLastCorrespondenceDate(contact.id).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <button className="text-primary-600 hover:text-primary-700 p-1">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No messages yet. Add contacts to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
                  <Mail className="w-4 h-4" />
                  Compose Email
                </button>
                <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                  <MessageCircle className="w-4 h-4" />
                  Send SMS
                </button>
                <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                  <Send className="w-4 h-4" />
                  Start Sequence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== Marketing & Social Tab ========== */}
      {activeTab === 'marketing' && (
        <div>
          {/* Sub-tab Navigation */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMarketingSubTab('campaigns')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                marketingSubTab === 'campaigns'
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Campaigns & Marketing
            </button>
            <button
              onClick={() => setMarketingSubTab('social')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                marketingSubTab === 'social'
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Social Media
            </button>
          </div>

          {/* Campaigns Sub-Tab */}
          {marketingSubTab === 'campaigns' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Active Campaigns</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">8</p>
                  <p className="text-sm text-slate-400">+2 this week</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Total Recipients</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">15,247</p>
                  <p className="text-sm text-slate-400">+1,423 this month</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Megaphone className="w-6 h-6 text-purple-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Average Open Rate</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">24.6%</p>
                  <p className="text-sm text-slate-400">+2.1% from last campaign</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Campaign Templates</h3>
                    <p className="text-slate-500">Choose from proven campaign templates to get started</p>
                  </div>
                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                    Custom Campaign
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaignTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="group p-6 border-2 border-slate-200 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition text-left"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">{template.name}</h4>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{template.category}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{template.description}</p>
                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span>Est. Opens:</span>
                            <span className="font-medium">{template.metrics.estimatedOpens}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Clicks:</span>
                            <span className="font-medium">{template.metrics.estimatedClicks}</span>
                          </div>
                          <div className="text-xs"><span>Send Timing:</span></div>
                          <div className="text-xs text-slate-400 mt-1">{template.metrics.sendTime}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Social Media Sub-Tab */}
          {marketingSubTab === 'social' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Share2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Posts This Week</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">12</p>
                  <p className="text-sm text-slate-400">+3 vs last week</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Active Accounts</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">4</p>
                  <p className="text-sm text-slate-400">Twitter, Facebook, Instagram</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Scheduled Posts</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">7</p>
                  <p className="text-sm text-slate-400">Next post: Tomorrow 2:00 PM</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Avg. Engagement</h3>
                  <p className="text-3xl font-bold text-slate-900 mb-2">14.7%</p>
                  <p className="text-sm text-slate-400">+1.2% this week</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="text-center">
                  <Share2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Connect Social Media Accounts</h3>
                  <p className="text-slate-500 mb-6">
                    Connect your social media accounts to start posting and managing your social presence.
                  </p>
                  <button
                    onClick={() => alert('Social account connection coming soon!')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Connect Accounts
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== New Contact Modal ========== */}
      {showNewContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">New Contact</h2>
              <button onClick={() => setShowNewContact(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="+1 (555) 123-4567" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="CEO" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                  <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Acme Corp" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" placeholder="Additional notes..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewContact(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={creating || !formData.first_name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== Edit Contact Modal ========== */}
      {showEditContact && editingContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Edit Contact</h2>
              <button onClick={() => { setShowEditContact(false); setEditingContact(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={editFormData.first_name} onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input type="text" value={editFormData.last_name} onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input type="tel" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                  <input type="text" value={editFormData.company_name} onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                <input type="date" value={editFormData.date_of_birth} onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditContact(false); setEditingContact(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" disabled={updating || !editFormData.first_name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== Campaign Creation Modal ========== */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedTemplate ? `Create ${selectedTemplate.name} Campaign` : 'Create Custom Campaign'}
                </h2>
                {selectedTemplate && <p className="text-sm text-slate-500 mt-1">{selectedTemplate.description}</p>}
              </div>
              <button onClick={() => { setShowCampaignModal(false); setSelectedTemplate(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name <span className="text-red-500">*</span></label>
                <input type="text" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Enter campaign name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Subject <span className="text-red-500">*</span></label>
                <input type="text" value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Enter email subject line" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                  <select value={campaignForm.audience} onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    <option value="all">All Subscribers</option>
                    <option value="active">Active Users</option>
                    <option value="inactive">Inactive Users</option>
                    <option value="new">New Subscribers</option>
                    <option value="leads">Lead Prospects</option>
                    <option value="customers">Existing Customers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Send Date</label>
                  <input type="date" value={campaignForm.sendDate} onChange={(e) => setCampaignForm({ ...campaignForm, sendDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Description</label>
                <textarea value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" placeholder="Describe the campaign goals and content..." />
              </div>
              {selectedTemplate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 ${selectedTemplate.color} rounded-lg flex items-center justify-center`}>
                      <selectedTemplate.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{selectedTemplate.name} Template</h4>
                      <p className="text-sm text-slate-600">{selectedTemplate.category} campaign</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Estimated Opens:</span>
                      <p className="font-semibold text-slate-900">{selectedTemplate.metrics.estimatedOpens}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Estimated Clicks:</span>
                      <p className="font-semibold text-slate-900">{selectedTemplate.metrics.estimatedClicks}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => { setShowCampaignModal(false); setSelectedTemplate(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                <button type="button" onClick={handleCreateCampaign}
                  disabled={!campaignForm.name.trim() || !campaignForm.subject.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
