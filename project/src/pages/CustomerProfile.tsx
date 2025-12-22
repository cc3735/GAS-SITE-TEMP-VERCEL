import React from 'react';
import { useCustomerProfile, useCustomerJourney } from '../hooks/useCustomerProfile';
import { User, Mail, Phone, ShoppingBag, Globe, Calendar, DollarSign, Clock, MessageCircle, ArrowRight } from 'lucide-react';

const CustomerProfile: React.FC = () => {
  const customerId = 'mock_cust_id';
  const organizationId = 'mock_org_id';
  const { profile, identityLinks, loading: profileLoading } = useCustomerProfile(customerId, organizationId);
  const { events, loading: journeyLoading } = useCustomerJourney(customerId);

  if (profileLoading || journeyLoading) return <div className="p-8 text-white">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-white">Customer not found</div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100 p-6 flex gap-6">
        {/* Left Column - Profile Info */}
        <div className="w-1/3 space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                        {profile.primaryName ? profile.primaryName.charAt(0) : 'C'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{profile.primaryName}</h1>
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-900 text-green-400 border border-green-800 mt-1">
                            {profile.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-gray-300">
                        <Mail size={18} className="text-gray-500" />
                        <span>{profile.primaryEmail}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-300">
                        <Phone size={18} className="text-gray-500" />
                        <span>{profile.primaryPhone}</span>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase">Lifetime Value</p>
                        <p className="text-xl font-bold text-white mt-1">${profile.lifetimeValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase">Total Orders</p>
                        <p className="text-xl font-bold text-white mt-1">{profile.totalOrders}</p>
                    </div>
                </div>
            </div>

            {/* Linked Identities */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Linked Identities</h3>
                <div className="space-y-3">
                    {identityLinks.map(link => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded border border-gray-700">
                            <div className="flex items-center space-x-3">
                                {link.platform === 'shopify' && <ShoppingBag size={16} className="text-green-400" />}
                                {link.platform === 'instagram' && <Globe size={16} className="text-pink-500" />}
                                {link.platform === 'email' && <Mail size={16} className="text-blue-400" />}
                                <span className="text-sm text-gray-300 capitalize">{link.platform}</span>
                            </div>
                            <span className="text-xs text-green-500 flex items-center">
                                Verified
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Center Column - Journey Timeline */}
        <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-6">Unified Journey</h3>
            
            <div className="relative border-l-2 border-gray-700 ml-4 space-y-8 pl-8 pb-8">
                {events.map(event => (
                    <div key={event.id} className="relative">
                        <div className="absolute -left-[41px] top-1 bg-gray-800 border-2 border-gray-600 w-6 h-6 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-white text-sm">{event.title}</h4>
                                <span className="text-xs text-gray-500 flex items-center">
                                    <Clock size={12} className="mr-1" />
                                    {new Date(event.occurredAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{event.description}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700">
                                {event.platform}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Column - Agent History */}
        <div className="w-1/4 space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Agent Interactions</h3>
                <div className="space-y-4">
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">2 days ago</span>
                            <span className="text-xs text-green-400">Positive</span>
                        </div>
                        <p className="text-sm text-gray-300 italic">"Customer asked about bulk pricing. Agent provided tiered discount structure."</p>
                        <button className="mt-2 text-blue-400 text-xs flex items-center hover:underline">
                            View Transcript <ArrowRight size={12} className="ml-1" />
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sentiment Analysis</h3>
                <div className="text-center">
                    <div className="text-4xl font-bold text-green-400 mb-2">8.5</div>
                    <p className="text-sm text-gray-400">Generally Positive</p>
                    <div className="w-full h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-[85%]"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CustomerProfile;
