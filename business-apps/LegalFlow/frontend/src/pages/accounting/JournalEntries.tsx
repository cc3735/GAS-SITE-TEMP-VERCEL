import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessStore } from '@/lib/business-store';

interface Account {
    id: string;
    name: string;
}

interface JournalEntryItem {
    id: string;
    account_id: string;
    type: 'debit' | 'credit';
    amount: number;
    description?: string;
}

interface JournalEntry {
    id: string;
    date: string;
    description: string;
    items: JournalEntryItem[];
}

function JournalEntryForm({ onSave, onCancel }: { onSave: (data: Partial<JournalEntry>) => void, onCancel: () => void }) {
    const { selectedBusiness } = useBusinessStore();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([
        { account_id: '', type: 'debit', amount: 0 },
        { account_id: '', type: 'credit', amount: 0 },
    ]);

    const { data: accounts } = useQuery({
        queryKey: ['accounts', selectedBusiness?.id],
        queryFn: async () => {
            if (!selectedBusiness) return [];
            const response = await api.get<{ data: Account[] }>(`/accounting/${selectedBusiness.id}/accounts`);
            return response.data?.data;
        },
        enabled: !!selectedBusiness,
    });

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { account_id: '', type: 'debit', amount: 0 }]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ date, description, items });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="date" className="block font-bold mb-1">Date</label>
                    <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label htmlFor="description" className="block font-bold mb-1">Description</label>
                    <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
            </div>
            
            {items.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 mb-2">
                    <select value={item.account_id} onChange={(e) => handleItemChange(index, 'account_id', e.target.value)} className="w-full p-2 border rounded">
                        <option value="">Select Account</option>
                        {accounts?.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                    <select value={item.type} onChange={(e) => handleItemChange(index, 'type', e.target.value)} className="w-full p-2 border rounded">
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                    </select>
                    <input type="number" value={item.amount} onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value))} className="w-full p-2 border rounded" />
                </div>
            ))}

            <button type="button" onClick={addItem} className="px-4 py-2 rounded bg-gray-200 mb-4">Add Item</button>

            <div className="flex justify-end gap-2">
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

export default function JournalEntries() {
    const queryClient = useQueryClient();
    const { selectedBusiness } = useBusinessStore();
    const [isCreating, setIsCreating] = useState(false);

    const { data: entries, isLoading } = useQuery({
        queryKey: ['journalEntries', selectedBusiness?.id],
        queryFn: async () => {
            if (!selectedBusiness) return [];
            const response = await api.get<{ data: JournalEntry[] }>(`/accounting/${selectedBusiness.id}/journal-entries`);
            return response.data?.data;
        },
        enabled: !!selectedBusiness,
    });
    
    const createMutation = useMutation({
        mutationFn: (newEntry: Partial<JournalEntry>) => api.post(`/accounting/${selectedBusiness!.id}/journal-entries`, newEntry),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journalEntries', selectedBusiness?.id] });
            setIsCreating(false);
        },
    });

    if (!selectedBusiness) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-4">Journal Entries</h1>
                <BusinessSelector />
                <p className="mt-4">Please select a business to view the journal entries.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Journal Entries</h1>
                <BusinessSelector />
            </div>

            <div className="flex justify-end mb-4">
                <button onClick={() => setIsCreating(true)} className="px-4 py-2 rounded bg-blue-500 text-white">Add Journal Entry</button>
            </div>
            
            {isCreating && (
                <JournalEntryForm
                    onSave={(data) => createMutation.mutate(data)}
                    onCancel={() => setIsCreating(false)}
                />
            )}

            {isLoading ? (
                <p>Loading journal entries...</p>
            ) : (
                <div className="mt-4">
                    {entries && entries.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">Description</th>
                                    <th className="text-left p-2">Debits</th>
                                    <th className="text-left p-2">Credits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map(entry => {
                                    const debits = entry.items.filter(i => i.type === 'debit').reduce((sum, i) => sum + i.amount, 0);
                                    const credits = entry.items.filter(i => i.type === 'credit').reduce((sum, i) => sum + i.amount, 0);
                                    return (
                                        <tr key={entry.id} className="border-b">
                                            <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="p-2">{entry.description}</td>
                                            <td className="p-2">${debits.toFixed(2)}</td>
                                            <td className="p-2">${credits.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <p>No journal entries found for this business.</p>
                    )}
                </div>
            )}
        </div>
    );
}