import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useContacts } from '../../hooks/useContacts';
import { Users, Plus, Search, Mail, Phone, Building2, X, Loader2, Filter, Edit2, Calendar, MessageCircle, Clock, Send, Inbox, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClientRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  created_at: string;
  app_count?: number;
  app_ids?: string[];
}

const APP_LABELS: Record<string, string> = {
  legalflow: 'LegalFlow',
  courseflow: 'CourseFlow',
  foodtruck: 'FoodTruck',
  buildflow: 'BuildFlow',
  keysflow: 'KeysFlow',
};

const APP_OPTIONS = Object.entries(APP_LABELS).map(([id, label]) => ({ id, label }));

export default function OSCRM() {
  const { contacts, loading, createContact, updateContact } = useContacts();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine initial tab from URL
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'contacts' ? 'contacts' : tabParam === 'messages' ? 'messages' : 'clients';
  const [activeTab, setActiveTab] = useState<'contacts' | 'messages' | 'clients'>(initialTab);

  const [showNewContact, setShowNewContact] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [showEditContact, setShowEditContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
    company_name: '',
    date_of_birth: '',
    notes: '',
  });
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: '',
    company_name: '',
    date_of_birth: '',
    notes: '',
  });

  // --- Clients tab state ---
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState('');
  const filterApp = searchParams.get('app') ?? '';

  useEffect(() => {
    async function loadClients() {
      setClientsLoading(true);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, phone, subscription_tier, subscription_status, created_at')
        .order('created_at', { ascending: false });

      const { data: subs } = await supabase
        .from('user_app_subscriptions')
        .select('user_id, app_id')
        .eq('status', 'active');

      const subMap: Record<string, string[]> = {};
      (subs ?? []).forEach((s: { user_id: string; app_id: string }) => {
        if (!subMap[s.user_id]) subMap[s.user_id] = [];
        subMap[s.user_id].push(s.app_id);
      });

      const rows: ClientRow[] = (profiles ?? []).map((p: ClientRow) => ({
        ...p,
        app_ids: subMap[p.id] ?? [],
        app_count: (subMap[p.id] ?? []).length,
      }));

      setClients(rows);
      setClientsLoading(false);
    }
    loadClients();
  }, []);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      !clientSearch ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.full_name ?? '').toLowerCase().includes(clientSearch.toLowerCase());
    const matchesApp = !filterApp || (c.app_ids ?? []).includes(filterApp);
    return matchesSearch && matchesApp;
  });

  // --- Contacts helpers ---
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 ${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getLastCorrespondenceDate = (contactId: string) => {
    const hash = contactId.split('').reduce((a, b) => {
      return ((a << 5) - a + b.charCodeAt(0)) | 0;
    }, 0);
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
        setFormData({
          first_name: '', last_name: '', email: '', phone: '',
          title: '', company_name: '', date_of_birth: '', notes: '',
        });
        setShowNewContact(false);
      } else {
        alert('Failed to create contact. Please make sure you are logged in and have an organization selected.');
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
      await updateContact(editingContact.id, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        phone: editFormData.phone,
        title: editFormData.title,
        company_name: editFormData.company_name,
        date_of_birth: editFormData.date_of_birth,
        notes: editFormData.notes,
      });
      setShowEditContact(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Failed to update contact:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Merge org contacts + platform clients into a single "All Contacts" list
  const clientsAsContacts = clients.map((c) => {
    const nameParts = (c.full_name ?? '').split(' ');
    return {
      id: c.id,
      organization_id: '',
      first_name: nameParts[0] || c.email,
      last_name: nameParts.slice(1).join(' ') || null,
      email: c.email,
      phone: c.phone,
      title: c.subscription_tier ? `${c.subscription_tier} tier` : null,
      company_id: null,
      company_name: (c.app_ids ?? []).map((a: string) => APP_LABELS[a] ?? a).join(', ') || null,
      date_of_birth: null,
      notes: null,
      lead_status: c.subscription_status === 'active' ? 'qualified' : 'new',
      lead_score: 0,
      tags: null,
      created_at: c.created_at,
      updated_at: c.created_at,
      _source: 'client' as const,
    };
  });

  const allContacts = [
    ...contacts.map((c) => ({ ...c, _source: 'contact' as const })),
    ...clientsAsContacts,
  ];

  const filteredContacts = allContacts.filter((contact) => {
    const matchesSearch =
      contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || contact.lead_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-900/30 text-blue-400',
      qualified: 'bg-green-900/30 text-green-400',
      unqualified: 'bg-gray-800 text-gray-300',
      contacted: 'bg-yellow-900/30 text-yellow-400',
    };
    return colors[status] || 'bg-gray-800 text-gray-300';
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary-400" />
          <h1 className="text-3xl font-bold text-white">CRM</h1>
        </div>
        {activeTab === 'contacts' && (
          <button
            onClick={() => setShowNewContact(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            New Contact
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Current Clients
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contacts'
                  ? 'border-blue-500 text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Contacts
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Unified Messages
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'contacts' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white"
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

          {filteredContacts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {contacts.length === 0 ? 'No contacts yet' : 'No contacts found'}
              </h3>
              <p className="text-gray-400 mb-4">
                {contacts.length === 0
                  ? 'Add your first contact to get started'
                  : 'Try adjusting your search or filters'}
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
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Correspondence</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {filteredContacts.map((contact) => (
                    <tr
                      key={`${contact._source}-${contact.id}`}
                      onClick={() => {
                        if (contact._source === 'client') {
                          navigate(`/os/clients/${contact.id}`);
                        } else {
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
                        }
                      }}
                      className="hover:bg-gray-800 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {contact.first_name.charAt(0)}
                            {contact.last_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {contact.first_name} {contact.last_name}
                              </span>
                              {contact._source === 'client' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 font-medium">Client</span>
                              )}
                            </div>
                            {contact.date_of_birth && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(contact.date_of_birth).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {contact.company_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{contact.title || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white flex items-center gap-2">
                          {contact.email ? (
                            <>
                              <Mail className="w-4 h-4 text-gray-400" />
                              {contact.email}
                            </>
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white flex items-center gap-2">
                          {contact.phone ? (
                            <>
                              <Phone className="w-4 h-4 text-gray-400" />
                              {formatPhoneNumber(contact.phone)}
                            </>
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('messages');
                            }}
                            className="text-primary-400 hover:text-primary-300 flex items-center gap-2 transition"
                          >
                            <Clock className="w-4 h-4" />
                            {getLastCorrespondenceDate(contact.id).toLocaleDateString()}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.lead_status)}`}>
                          {contact.lead_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {contact._source === 'client' ? (
                          <Link
                            to={`/os/clients/${contact.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary-400 hover:text-primary-300 p-2 rounded-lg hover:bg-primary-900/20 transition inline-flex"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
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
                            className="text-indigo-400 hover:text-indigo-300 p-2 rounded-lg hover:bg-indigo-900/20 transition"
                          >
                            <Edit2 className="w-4 h-4" />
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
      )}

      {activeTab === 'messages' && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-8 h-8 text-primary-400" />
              <h2 className="text-2xl font-bold text-white">Unified Messages</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Message Channels */}
              <div className="lg:col-span-1">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-4">Communication Channels</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700">
                      <Mail className="w-5 h-5 text-primary-400" />
                      <div>
                        <div className="font-medium text-white">Email</div>
                        <div className="text-sm text-gray-500">12 unread</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="font-medium text-white">SMS</div>
                        <div className="text-sm text-gray-500">3 unread</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700">
                      <Send className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="font-medium text-white">Social DMs</div>
                        <div className="text-sm text-gray-500">8 unread</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded border border-gray-700">
                      <Inbox className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="font-medium text-white">Forms</div>
                        <div className="text-sm text-gray-500">5 unread</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="lg:col-span-2">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Recent Communications</h3>
                    <select className="px-3 py-1 text-sm border border-gray-600 rounded bg-gray-800 text-white">
                      <option>All Contacts</option>
                      <option>Unanswered</option>
                      <option>This Week</option>
                    </select>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {contacts.slice(0, 6).map((contact, index) => (
                      <div key={contact.id} className="bg-gray-900 rounded-lg border border-gray-700 p-4 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              {contact.first_name.charAt(0)}
                              {contact.last_name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">
                                  {contact.first_name} {contact.last_name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  index % 3 === 0 ? 'bg-blue-900/30 text-blue-400' :
                                  index % 3 === 1 ? 'bg-green-900/30 text-green-400' :
                                  'bg-orange-900/30 text-orange-400'
                                }`}>
                                  {index % 3 === 0 ? 'Email' : index % 3 === 1 ? 'SMS' : 'Social'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-2">
                                {index % 3 === 0 ? 'Following up on our conversation about AI solutions...' :
                                 index % 3 === 1 ? 'Thanks for your interest! Here are more details...' :
                                 'Check out our latest campaign on LinkedIn!'}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {getLastCorrespondenceDate(contact.id).toLocaleDateString()} at {getLastCorrespondenceDate(contact.id).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <button className="text-primary-400 hover:text-primary-300 p-1">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
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

      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Client count */}
          <p className="text-gray-400 text-sm">
            {clientsLoading ? '…' : `${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''}`}
            {filterApp ? ` with ${APP_LABELS[filterApp] ?? filterApp}` : ''}
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterApp}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) {
                  params.set('app', e.target.value);
                } else {
                  params.delete('app');
                }
                params.set('tab', 'clients');
                setSearchParams(params);
              }}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All apps</option>
              {APP_OPTIONS.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {clientsLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 rounded bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-500 text-sm">No clients found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Client</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Apps</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Tier</th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-white font-medium truncate max-w-[200px]">
                          {client.full_name || client.email}
                        </p>
                        {client.full_name && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{client.email}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(client.app_ids ?? []).length === 0 ? (
                            <span className="text-gray-600 text-xs">None</span>
                          ) : (
                            (client.app_ids ?? []).map((appId) => (
                              <span
                                key={appId}
                                className="inline-block px-2 py-0.5 rounded-full text-xs bg-primary-900/50 text-primary-300 border border-primary-700/30"
                              >
                                {APP_LABELS[appId] ?? appId}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="capitalize text-gray-400 text-xs">
                          {client.subscription_tier ?? 'free'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500 text-xs">
                        {new Date(client.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/os/clients/${client.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showNewContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Contact</h2>
              <button onClick={() => setShowNewContact(false)} className="text-gray-400 hover:text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                    placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input type="text" value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                    placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input type="tel" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="+1 (555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input type="text" value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="Acme Corporation" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                  <input type="date" value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                  <input type="text" value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                    placeholder="Marketing Manager" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="Additional notes about this contact..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewContact(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={creating || !formData.first_name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditContact && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Contact</h2>
              <button onClick={() => { setShowEditContact(false); setEditingContact(null); }}
                className="text-gray-400 hover:text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={editFormData.first_name}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                    placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input type="text" value={editFormData.last_name}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                    placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input type="email" value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input type="tel" value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="+1 (555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input type="text" value={editFormData.company_name}
                  onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="Acme Corporation" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                  <input type="date" value={editFormData.date_of_birth}
                    onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                  <input type="text" value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-gray-800 text-white placeholder-gray-500"
                    placeholder="Marketing Manager" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none bg-gray-800 text-white placeholder-gray-500"
                  placeholder="Additional notes about this contact..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditContact(false); setEditingContact(null); }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition">Cancel</button>
                <button type="submit" disabled={updating || !editFormData.first_name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
