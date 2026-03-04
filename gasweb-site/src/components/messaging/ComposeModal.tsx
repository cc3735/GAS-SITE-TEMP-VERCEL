import { useState } from 'react';
import { X, Mail, MessageCircle, Share2, Voicemail } from 'lucide-react';
import type { Contact } from '../../hooks/useContacts';

const CHANNELS = [
  { value: 'email', label: 'Email', icon: Mail, color: 'text-blue-500' },
  { value: 'sms', label: 'SMS', icon: MessageCircle, color: 'text-green-500' },
  { value: 'social', label: 'Social', icon: Share2, color: 'text-purple-500' },
  { value: 'voicemail', label: 'Voicemail', icon: Voicemail, color: 'text-orange-500' },
];

interface ComposeModalProps {
  contacts: Contact[];
  onSend: (data: {
    contact_id?: string;
    channel: string;
    subject?: string;
    body: string;
  }) => Promise<void>;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export default function ComposeModal({ contacts, onSend, onClose, theme }: ComposeModalProps) {
  const dark = theme === 'dark';
  const [contactId, setContactId] = useState('');
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const filteredContacts = contacts.filter(c => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    const name = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
    return name.includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      await onSend({
        contact_id: contactId || undefined,
        channel,
        subject: subject || undefined,
        body: body.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const inputClass = `w-full px-3 py-2 text-sm rounded-lg border ${
    dark
      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
  } focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500`;

  const labelClass = `block text-sm font-medium mb-1 ${dark ? 'text-gray-300' : 'text-slate-700'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-lg rounded-xl shadow-xl ${
        dark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-slate-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${dark ? 'border-gray-700' : 'border-slate-200'}`}>
          <h3 className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            New Message
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Channel */}
          <div>
            <label className={labelClass}>Channel</label>
            <div className="flex gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${
                      channel === ch.value
                        ? 'bg-primary-600 text-white'
                        : dark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipient */}
          <div>
            <label className={labelClass}>To (Contact)</label>
            <input
              type="text"
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className={inputClass}
            />
            {contactSearch && filteredContacts.length > 0 && !contactId && (
              <div className={`mt-1 max-h-32 overflow-y-auto rounded-lg border ${
                dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'
              }`}>
                {filteredContacts.slice(0, 5).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setContactId(c.id);
                      setContactSearch(`${c.first_name} ${c.last_name || ''}`.trim());
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition ${
                      dark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{c.first_name} {c.last_name}</span>
                    {c.email && (
                      <span className={`ml-2 text-xs ${dark ? 'text-gray-500' : 'text-slate-400'}`}>
                        {c.email}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {contactId && (
              <button
                type="button"
                onClick={() => {
                  setContactId('');
                  setContactSearch('');
                }}
                className={`mt-1 text-xs ${dark ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Subject (for email) */}
          {channel === 'email' && (
            <div>
              <label className={labelClass}>Subject</label>
              <input
                type="text"
                placeholder="Email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className={labelClass}>Message</label>
            <textarea
              placeholder="Type your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                dark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!body.trim() || sending}
              className={`px-4 py-2 text-sm rounded-lg transition ${
                body.trim() && !sending
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : dark
                    ? 'bg-gray-700 text-gray-500'
                    : 'bg-slate-200 text-slate-400'
              }`}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
