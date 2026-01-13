/**
 * Bank Accounts Page
 *
 * Manage connected bank accounts (Plaid)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building, RefreshCw, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import PlaidLinkButton from '../../components/bookkeeping/PlaidLinkButton';

interface LinkedAccount {
    id: string;
    institutionName: string;
    institutionId: string;
    accounts: Array<{
        accountId: string;
        name: string;
        mask: string;
        subtype: string;
        currentBalance: number;
    }>;
    status: string;
    lastSync: string;
}

export default function BankAccounts() {
    const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/bookkeeping/accounts', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAccounts(data.data);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (accountId: string) => {
        try {
            setSyncing(accountId);
            const response = await fetch('/api/bookkeeping/accounts/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    linkedAccountId: accountId,
                }),
            });

            if (response.ok) {
                // Refresh accounts to show updated sync time
                fetchAccounts();
            }
        } catch (error) {
            console.error('Error syncing account:', error);
        } finally {
            setSyncing(null);
        }
    };

    const handleDelete = async (accountId: string) => {
        if (!confirm('Are you sure you want to disconnect this account? All associated data will be deleted.')) {
            return;
        }

        try {
            const response = await fetch(`/api/integrations/plaid/accounts/${accountId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                setAccounts(accounts.filter((a) => a.id !== accountId));
            }
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/bookkeeping" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
                            <p className="text-gray-600">Manage your bank connections</p>
                        </div>
                    </div>
                    <PlaidLinkButton onSuccess={fetchAccounts} />
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h3>
                        <p className="text-gray-500 mb-6">Connect your bank accounts to automatically import transactions.</p>
                        <PlaidLinkButton onSuccess={fetchAccounts} className="mx-auto" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {accounts.map((account) => (
                            <div key={account.id} className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Building className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{account.institutionName}</h3>
                                            <div className="flex items-center gap-2">
                                                {account.status === 'active' ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <CheckCircle className="w-3 h-3" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                        <AlertCircle className="w-3 h-3" /> Reauth Required
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">
                                                    Last sync: {new Date(account.lastSync).toLocaleDateString()} {new Date(account.lastSync).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSync(account.id)}
                                            disabled={syncing === account.id}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Sync Transactions"
                                        >
                                            <RefreshCw className={`w-5 h-5 ${syncing === account.id ? 'animate-spin text-blue-600' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Disconnect Account"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4">
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Accounts</h4>
                                    <div className="space-y-3">
                                        {account.accounts.map((acc) => (
                                            <div key={acc.accountId} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-900 font-medium">{acc.name}</span>
                                                    <span className="text-gray-500 text-sm">•••• {acc.mask}</span>
                                                    <span className="text-xs text-gray-400 capitalize bg-gray-200 px-2 py-0.5 rounded">
                                                        {acc.subtype.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(acc.currentBalance)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
