import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Phone, Voicemail, ChevronDown, ChevronRight, Play, Clock, MapPin, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

interface CallLog {
  id: string;
  call_sid: string | null;
  caller_phone: string | null;
  called_number: string | null;
  direction: string;
  status: string;
  duration_seconds: number | null;
  transcript: Json;
  tool_calls: Json;
  sentiment: string | null;
  summary: string | null;
  recording_url: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

interface VoicemailRow {
  id: string;
  call_sid: string;
  recording_sid: string | null;
  recording_url: string | null;
  recording_duration: number | null;
  transcription_text: string | null;
  caller_phone: string | null;
  called_number: string | null;
  caller_city: string | null;
  caller_state: string | null;
  caller_country: string | null;
  speech_result: string | null;
  status: string;
  created_at: string;
}

const CALL_STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/30',
  completed: 'bg-green-900/50 text-green-300 border-green-700/30',
  failed: 'bg-red-900/50 text-red-300 border-red-700/30',
  no_answer: 'bg-gray-800 text-gray-400 border-gray-700',
};

const VM_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-900/50 text-blue-300 border-blue-700/30',
  reviewed: 'bg-green-900/50 text-green-300 border-green-700/30',
  archived: 'bg-gray-800 text-gray-400 border-gray-700',
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatPhone(phone: string | null): string {
  if (!phone) return 'Unknown';
  if (phone.length === 12 && phone.startsWith('+1')) {
    return `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
  }
  return phone;
}

interface TranscriptEntry {
  role: string;
  parts: { text: string }[];
}

export default function OSVoice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentOrganization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'calls' | 'voicemails'>(
    (searchParams.get('tab') as 'calls' | 'voicemails') || 'calls'
  );
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [voicemails, setVoicemails] = useState<VoicemailRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (currentOrganization?.id) {
      if (activeTab === 'calls') loadCallLogs();
      else loadVoicemails();
    }
  }, [activeTab, currentOrganization?.id]);

  async function loadCallLogs() {
    setIsLoading(true);
    const { data } = await supabase
      .from('voice_call_logs')
      .select('id, call_sid, caller_phone, called_number, direction, status, duration_seconds, transcript, tool_calls, sentiment, summary, recording_url, started_at, ended_at, created_at')
      .eq('organization_id', currentOrganization!.id)
      .order('created_at', { ascending: false });
    setCallLogs((data ?? []) as CallLog[]);
    setIsLoading(false);
  }

  async function loadVoicemails() {
    setIsLoading(true);
    const { data } = await supabase
      .from('voicemails')
      .select('id, call_sid, recording_sid, recording_url, recording_duration, transcription_text, caller_phone, called_number, caller_city, caller_state, caller_country, speech_result, status, created_at')
      .order('created_at', { ascending: false });
    setVoicemails((data ?? []) as VoicemailRow[]);
    setIsLoading(false);
  }

  async function updateVoicemailStatus(id: string, newStatus: string) {
    await supabase.from('voicemails').update({ status: newStatus }).eq('id', id);
    setVoicemails((prev) => prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v)));
  }

  const switchTab = (tab: 'calls' | 'voicemails') => {
    setActiveTab(tab);
    setExpandedId(null);
    setSearch('');
    setFilterStatus('');
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  const filteredCalls = callLogs.filter((c) => {
    const matchesSearch = !search || (c.caller_phone ?? '').includes(search) || (c.summary ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredVoicemails = voicemails.filter((v) => {
    const matchesSearch = !search || (v.caller_phone ?? '').includes(search) || (v.transcription_text ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Voice & Calls</h1>
        <p className="text-gray-400 mt-1 text-sm">
          {isLoading ? '...' : activeTab === 'calls'
            ? `${filteredCalls.length} call log${filteredCalls.length !== 1 ? 's' : ''}`
            : `${filteredVoicemails.length} voicemail${filteredVoicemails.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 w-fit">
        <button
          onClick={() => switchTab('calls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'calls' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Phone className="w-4 h-4" />
          Call Logs
        </button>
        <button
          onClick={() => switchTab('voicemails')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'voicemails' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Voicemail className="w-4 h-4" />
          Voicemails
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'calls' ? 'Search by phone or summary...' : 'Search by phone or transcription...'}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {activeTab === 'calls' ? (
            <>
              <option value="">All statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </>
          ) : (
            <>
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </>
          )}
        </select>
      </div>

      {/* Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'calls' ? (
          <CallLogsTable
            calls={filteredCalls}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
          />
        ) : (
          <VoicemailsTable
            voicemails={filteredVoicemails}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            onUpdateStatus={updateVoicemailStatus}
          />
        )}
      </div>
    </div>
  );
}

function CallLogsTable({
  calls,
  expandedId,
  setExpandedId,
}: {
  calls: CallLog[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  if (calls.length === 0) {
    return (
      <div className="py-16 text-center">
        <Phone className="mx-auto w-10 h-10 text-gray-700 mb-3" />
        <p className="text-gray-500 text-sm">No call logs found.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium w-8"></th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Date/Time</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Caller</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Duration</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Status</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden lg:table-cell">Sentiment</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {calls.map((call) => {
          const isExpanded = expandedId === call.id;
          const transcript = Array.isArray(call.transcript) ? (call.transcript as TranscriptEntry[]) : [];
          const toolCalls = Array.isArray(call.tool_calls) ? call.tool_calls : [];

          return (
            <>
              <tr
                key={call.id}
                onClick={() => setExpandedId(isExpanded ? null : call.id)}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <td className="pl-5 py-3.5">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-white">{new Date(call.started_at).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{new Date(call.started_at).toLocaleTimeString()}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-white">{formatPhone(call.caller_phone)}</p>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell text-gray-400">
                  {formatDuration(call.duration_seconds)}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs border capitalize ${CALL_STATUS_COLORS[call.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {call.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  {call.sentiment ? (
                    <span className="text-gray-400 capitalize">{call.sentiment}</span>
                  ) : (
                    <span className="text-gray-600">--</span>
                  )}
                </td>
              </tr>

              {isExpanded && (
                <tr key={`${call.id}-detail`} className="bg-gray-800/30">
                  <td colSpan={6} className="px-5 py-4">
                    <div className="space-y-4">
                      {/* Summary */}
                      {call.summary && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Summary</p>
                          <p className="text-sm text-gray-300">{call.summary}</p>
                        </div>
                      )}

                      {/* Transcript */}
                      {transcript.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            Transcript
                          </p>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {transcript.map((entry, i) => {
                              const text = entry.parts?.map((p) => p.text).join('') || '';
                              if (!text.trim()) return null;
                              const isUser = entry.role === 'user';
                              return (
                                <div
                                  key={i}
                                  className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div
                                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                                      isUser
                                        ? 'bg-gray-700 text-gray-200'
                                        : 'bg-primary-600/30 text-primary-200'
                                    }`}
                                  >
                                    <p className="text-[10px] uppercase tracking-wide mb-0.5 opacity-60">
                                      {isUser ? 'Caller' : 'AI'}
                                    </p>
                                    {text}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tool Calls */}
                      {toolCalls.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tool Calls</p>
                          <div className="flex flex-wrap gap-2">
                            {toolCalls.map((tc: any, i: number) => (
                              <span key={i} className="px-2 py-1 rounded bg-gray-700 text-xs text-gray-300">
                                {tc.name || tc.function?.name || JSON.stringify(tc)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mobile-only info */}
                      <div className="md:hidden text-xs text-gray-500">
                        Duration: {formatDuration(call.duration_seconds)}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          );
        })}
      </tbody>
    </table>
  );
}

function VoicemailsTable({
  voicemails,
  expandedId,
  setExpandedId,
  onUpdateStatus,
}: {
  voicemails: VoicemailRow[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (voicemails.length === 0) {
    return (
      <div className="py-16 text-center">
        <Voicemail className="mx-auto w-10 h-10 text-gray-700 mb-3" />
        <p className="text-gray-500 text-sm">No voicemails found.</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-800">
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium w-8"></th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Date/Time</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Caller</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Location</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium hidden md:table-cell">Duration</th>
          <th className="text-left px-5 py-3 text-xs text-gray-500 uppercase tracking-wide font-medium">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {voicemails.map((vm) => {
          const isExpanded = expandedId === vm.id;
          const location = [vm.caller_city, vm.caller_state].filter(Boolean).join(', ');
          const audioUrl = vm.recording_url
            ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voicemail-audio?url=${encodeURIComponent(vm.recording_url)}`
            : null;

          return (
            <>
              <tr
                key={vm.id}
                onClick={() => setExpandedId(isExpanded ? null : vm.id)}
                className="hover:bg-gray-800/50 transition-colors cursor-pointer"
              >
                <td className="pl-5 py-3.5">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-white">{new Date(vm.created_at).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{new Date(vm.created_at).toLocaleTimeString()}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-white">{formatPhone(vm.caller_phone)}</p>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  {location ? (
                    <span className="text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location}
                    </span>
                  ) : (
                    <span className="text-gray-600">--</span>
                  )}
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(vm.recording_duration)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs border capitalize ${VM_STATUS_COLORS[vm.status] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {vm.status}
                  </span>
                </td>
              </tr>

              {isExpanded && (
                <tr key={`${vm.id}-detail`} className="bg-gray-800/30">
                  <td colSpan={6} className="px-5 py-4">
                    <div className="space-y-4">
                      {/* Audio Player */}
                      {audioUrl && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            <Play className="w-3 h-3 inline mr-1" />
                            Recording
                          </p>
                          <audio controls className="w-full max-w-lg" preload="none">
                            <source src={audioUrl} type="audio/mpeg" />
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                      )}

                      {/* Transcription */}
                      {vm.transcription_text && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Transcription</p>
                          <p className="text-sm text-gray-300 whitespace-pre-line">{vm.transcription_text}</p>
                        </div>
                      )}

                      {/* Speech Result (what caller said before voicemail) */}
                      {vm.speech_result && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Caller Said (before voicemail)</p>
                          <p className="text-sm text-gray-400 italic">"{vm.speech_result}"</p>
                        </div>
                      )}

                      {/* Status Actions */}
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Mark as:</p>
                        {['new', 'reviewed', 'archived'].map((s) => (
                          <button
                            key={s}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(vm.id, s);
                            }}
                            disabled={vm.status === s}
                            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                              vm.status === s
                                ? VM_STATUS_COLORS[s] + ' font-semibold'
                                : 'border-gray-700 text-gray-500 hover:text-white hover:border-gray-500'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Mobile-only info */}
                      <div className="md:hidden text-xs text-gray-500 space-y-1">
                        {location && <p>Location: {location}</p>}
                        <p>Duration: {formatDuration(vm.recording_duration)}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          );
        })}
      </tbody>
    </table>
  );
}
