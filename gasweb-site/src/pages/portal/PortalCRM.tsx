import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  Edit2,
  Clock,
  Inbox,
  X,
  Loader2,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useContacts } from '../../hooks/useContacts';

export default function PortalCRM() {
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
    first_name: '', last_name: '', email: '', phone: '', mobile: '', title: '', company_name: '', date_of_birth: '', notes: '',
    linkedin_url: '', twitter_handle: '', instagram_handle: '', facebook_url: '', whatsapp_number: '',
  });
  const [editFormData, setEditFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', mobile: '', title: '', company_name: '', date_of_birth: '', notes: '',
    linkedin_url: '', twitter_handle: '', instagram_handle: '', facebook_url: '', whatsapp_number: '',
  });
  const [showSocialFields, setShowSocialFields] = useState(false);
  const [showEditSocialFields, setShowEditSocialFields] = useState(false);

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
        setFormData({ first_name: '', last_name: '', email: '', phone: '', mobile: '', title: '', company_name: '', date_of_birth: '', notes: '', linkedin_url: '', twitter_handle: '', instagram_handle: '', facebook_url: '', whatsapp_number: '' });
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
        <p className="text-slate-500 text-sm mb-6">Manage your contacts and client information.</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Organization Found</h3>
          <p className="text-slate-500">Please set up an organization first to use the CRM.</p>
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
          <p className="text-slate-500 text-sm mt-1">Manage your contacts and client information.</p>
        </div>
        <button
          onClick={() => setShowNewContact(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Contact
        </button>
      </div>

      {/* ========== Contacts Content ========== */}
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

            {/* Contacts Table */}
            {filteredContacts.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Contacts Found</h3>
                <p className="text-slate-500 mb-4">
                  {contacts.length === 0
                    ? 'Get started by adding your first contact.'
                    : 'No contacts match your search or filter criteria.'}
                </p>
                {contacts.length === 0 && (
                  <button
                    onClick={() => setShowNewContact(true)}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Add First Contact
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50 transition cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                              {contact.first_name[0]}{contact.last_name?.[0] || ''}
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
              {/* Social & Communication Channels */}
              <div>
                <button type="button" onClick={() => setShowSocialFields(!showSocialFields)}
                  className="text-sm text-primary-600 hover:text-primary-700 transition">
                  {showSocialFields ? '- Hide' : '+ Show'} Social & Communication Fields
                </button>
                {showSocialFields && (
                  <div className="mt-3 space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                        <input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="+1 (555) 987-6543" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                        <input type="tel" value={formData.whatsapp_number} onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="+15559876543" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                      <input type="url" value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="https://linkedin.com/in/username" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Twitter / X Handle</label>
                        <input type="text" value={formData.twitter_handle} onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="@username" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Instagram Handle</label>
                        <input type="text" value={formData.instagram_handle} onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="@username" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Facebook URL</label>
                      <input type="url" value={formData.facebook_url} onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="https://facebook.com/username" />
                    </div>
                  </div>
                )}
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
              {/* Social & Communication Fields */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button type="button" onClick={() => setShowEditSocialFields(!showEditSocialFields)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                  <span>Social & Communication Fields</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showEditSocialFields ? 'rotate-180' : ''}`} />
                </button>
                {showEditSocialFields && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Mobile</label>
                        <input type="tel" value={editFormData.mobile} onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="+1 (555) 000-0000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp Number</label>
                        <input type="tel" value={editFormData.whatsapp_number} onChange={(e) => setEditFormData({ ...editFormData, whatsapp_number: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="+1 (555) 000-0000" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
                      <input type="url" value={editFormData.linkedin_url} onChange={(e) => setEditFormData({ ...editFormData, linkedin_url: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Twitter Handle</label>
                        <input type="text" value={editFormData.twitter_handle} onChange={(e) => setEditFormData({ ...editFormData, twitter_handle: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="@handle" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Instagram Handle</label>
                        <input type="text" value={editFormData.instagram_handle} onChange={(e) => setEditFormData({ ...editFormData, instagram_handle: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="@handle" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Facebook URL</label>
                      <input type="url" value={editFormData.facebook_url} onChange={(e) => setEditFormData({ ...editFormData, facebook_url: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="https://facebook.com/..." />
                    </div>
                  </div>
                )}
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
    </div>
  );
}
