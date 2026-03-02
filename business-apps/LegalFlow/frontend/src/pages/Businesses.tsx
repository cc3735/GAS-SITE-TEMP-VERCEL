import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Business {
    id: string;
    name: string;
    industry?: string;
    created_at: string;
}

function BusinessForm({ business, onSave, onCancel }: { business?: Business, onSave: (data: Partial<Business>) => void, onCancel: () => void }) {
    const [name, setName] = useState(business?.name || '');
    const [industry, setIndustry] = useState(business?.industry || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: business?.id, name, industry });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded">
            <div className="mb-4">
                <label htmlFor="name" className="block font-bold mb-1">Business Name</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>
            <div className="mb-4">
                <label htmlFor="industry" className="block font-bold mb-1">Industry</label>
                <input
                    type="text"
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white">Save</button>
            </div>
        </form>
    );
}

export default function Businesses() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState<Business | undefined>(undefined);

    const { data: businesses, isLoading } = useQuery({
        queryKey: ['businesses'],
        queryFn: async () => {
            const response = await api.get<{ data: Business[] }>('/users/businesses');
            return response.data?.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (newBusiness: Partial<Business>) => api.post('/users/businesses', newBusiness),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            setIsCreating(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (updatedBusiness: Partial<Business>) => api.put(`/users/businesses/${updatedBusiness.id}`, updatedBusiness),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            setEditingBusiness(undefined);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/users/businesses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
        },
    });

    const handleSave = (data: Partial<Business>) => {
        if (data.id) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Businesses</h1>
                <button onClick={() => setIsCreating(true)} className="px-4 py-2 rounded bg-blue-500 text-white">
                    Add Business
                </button>
            </div>

            {(isCreating || editingBusiness) && (
                <div className="mb-4">
                    <BusinessForm
                        business={editingBusiness}
                        onSave={handleSave}
                        onCancel={() => {
                            setIsCreating(false);
                            setEditingBusiness(undefined);
                        }}
                    />
                </div>
            )}

            <div>
                {businesses && businesses.length > 0 ? (
                    <ul className="space-y-2">
                        {businesses.map((business) => (
                            <li key={business.id} className="p-2 border rounded flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{business.name}</p>
                                    <p className="text-sm text-gray-500">{business.industry}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingBusiness(business)} className="px-2 py-1 rounded bg-gray-200">Edit</button>
                                    <button onClick={() => deleteMutation.mutate(business.id)} className="px-2 py-1 rounded bg-red-500 text-white">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No businesses found. Add your first business!</p>
                )}
            </div>
        </div>
    );
}