import React from 'react';
import { useNudgeCampaigns } from '../hooks/useIntakeNudge';
import { Zap, Clock, Mail, MessageSquare, Play, Pause, Edit, Trash2 } from 'lucide-react';

export default function NudgeCampaignBuilder() {
  const { campaigns, loading } = useNudgeCampaigns();

  if (loading) return <div className="p-8">Loading Nudge Engine...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Nudge Engine</h1>
            <p className="text-gray-600">Automated re-engagement campaigns for ghosting leads.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            <Zap size={18} />
            Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${campaign.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {campaign.channel === 'sms' ? <MessageSquare size={24} /> : <Mail size={24} />}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Clock size={14} /> Delay: {campaign.delayHours}h
                            </span>
                            <span className="flex items-center gap-1">
                                <Zap size={14} /> Trigger: {campaign.triggerState}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{campaign.totalSent}</p>
                        <p className="text-xs text-gray-500 uppercase">Sent</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{campaign.totalConverted}</p>
                        <p className="text-xs text-gray-500 uppercase">Converted</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200 mx-4"></div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Edit size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={18} />
                        </button>
                        <button className={`p-2 rounded-lg transition ${campaign.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                            {campaign.isActive ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        ))}

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer group">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 text-gray-400">
                <Zap size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Create New Nudge</h3>
            <p className="text-sm text-gray-500">Set up a new automated workflow</p>
        </div>
      </div>
    </div>
  );
}
