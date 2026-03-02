import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessStore } from '@/lib/business-store';

interface Account {
    id: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    account_number?: string;
    description?: string;
    balance: number;
}

function AccountForm({ account, onSave, onCancel }: { account?: Account, onSave: (data: Partial<Account>) => void, onCancel: () => void }) {
    const [name, setName] = useState(account?.name || '');
    const [type, setType] = useState(account?.type || 'asset');
    const [accountNumber, setAccountNumber] = useState(account?.account_number || '');
    const [description, setDescription] = useState(account?.description || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: account?.id, name, type, account_number: accountNumber, description });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded mb-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block font-bold mb-1">Account Name</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label htmlFor="type" className="block font-bold mb-1">Account Type</label>
                    <select id="type" value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-2 border rounded">
                        <option value="asset">Asset</option>
                        <option value="liability">Liability</option>
                        <option value="equity">Equity</option>
                        <option value="revenue">Revenue</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="accountNumber" className="block font-bold mb-1">Account Number</label>
                    <input type="text" id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label htmlFor="description" className="block font-bold mb-1">Description</label>
                    <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" />
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white">Save</button>
            </div>
        </form>
    );
}


function BusinessSelector() {
    const { businesses, selectedBusiness, selectBusiness, fetchBusinesses } = useBusinessStore();

    useEffect(() => {
        if (businesses.length === 0) {
            fetchBusinesses();
        }
    }, [businesses, fetchBusinesses]);

    if (businesses.length === 0) {
        return <p>No businesses found. Please add a business first.</p>;
    }

    return (
        <select
            value={selectedBusiness?.id || ''}
            onChange={(e) => {
                const business = businesses.find(b => b.id === e.target.value) || null;
                selectBusiness(business);
            }}
            className="p-2 border rounded"
        >
            <option value="">Select a business</option>
            {businesses.map(business => (
                <option key={business.id} value={business.id}>{business.name}</option>
            ))}
        </select>
    );
}

export default function ChartOfAccounts() {
    const queryClient = useQueryClient();
    const { selectedBusiness } = useBusinessStore();
    const [isCreating, setIsCreating] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);

    const { data: accounts, isLoading } = useQuery({
        queryKey: ['accounts', selectedBusiness?.id],
        queryFn: async () => {
            if (!selectedBusiness) return [];
            const response = await api.get<{ data: Account[] }>(`/accounting/${selectedBusiness.id}/accounts`);
            return response.data?.data;
        },
        enabled: !!selectedBusiness,
    });

    const createMutation = useMutation({
        mutationFn: (newAccount: Partial<Account>) => api.post(`/accounting/${selectedBusiness!.id}/accounts`, newAccount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts', selectedBusiness?.id] });
            setIsCreating(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedAccount: Partial<Account>) => api.put(`/accounting/${selectedBusiness!.id}/accounts/${updatedAccount.id}`, updatedAccount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts', selectedBusiness?.id] });
            setEditingAccount(undefined);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/accounting/${selectedBusiness!.id}/accounts/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts', selectedBusiness?.id] });
        },
    });

    const handleSave = (data: Partial<Account>) => {
        if (data.id) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    if (!selectedBusiness) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-4">Chart of Accounts</h1>
                <BusinessSelector />
                <p className="mt-4">Please select a business to view the chart of accounts.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Chart of Accounts</h1>
                <BusinessSelector />
            </div>
            
            <div className="flex justify-end mb-4">
                <button onClick={() => setIsCreating(true)} className="px-4 py-2 rounded bg-blue-500 text-white">Add Account</button>
            </div>

            {(isCreating || editingAccount) && (
                <AccountForm
                    account={editingAccount}
                    onSave={handleSave}
                    onCancel={() => {
                        setIsCreating(false);
                        setEditingAccount(undefined);
                    }}
                />
            )}

            {isLoading ? (
                <p>Loading accounts...</p>
            ) : (
                <div className="mt-4">
                    {accounts && accounts.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Number</th>
                                    <th className="text-left p-2">Name</th>
                                    <th className="text-left p-2">Type</th>
                                    <th className="text-left p-2">Balance</th>
                                    <th className="text-left p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(account => (
                                    <tr key={account.id} className="border-b">
                                        <td className="p-2">{account.account_number}</td>
                                        <td className="p-2">{account.name}</td>
                                        <td className="p-2">{account.type}</td>
                                        <td className="p-2">${account.balance.toFixed(2)}</td>
                                        <td className="p-2">
                                            <button onClick={() => setEditingAccount(account)} className="px-2 py-1 rounded bg-gray-200">Edit</button>
                                            <button onClick={() => deleteMutation.mutate(account.id)} className="ml-2 px-2 py-1 rounded bg-red-500 text-white">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No accounts found for this business.</p>
                    )}
                </div>
            )}
        </div>
    );
}