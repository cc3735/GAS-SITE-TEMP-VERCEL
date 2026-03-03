import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface Business {
    id: string;
    name: string;
    industry?: string;
    ein?: string;
    address?: string;
    phone?: string;
    email?: string;
    state_of_registration?: string;
    point_of_contact?: string;
    registered_agent_name?: string;
    registered_agent_address?: string;
    created_at: string;
}

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1';

const US_STATES = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
    'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
    'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
    'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
    'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
    'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
    'Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia',
];

function BusinessForm({
    business,
    onSave,
    onCancel,
}: {
    business?: Business;
    onSave: (data: Partial<Business>) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState({
        name: business?.name || '',
        industry: business?.industry || '',
        ein: business?.ein || '',
        address: business?.address || '',
        phone: business?.phone || '',
        email: business?.email || '',
        state_of_registration: business?.state_of_registration || '',
        point_of_contact: business?.point_of_contact || '',
        registered_agent_name: business?.registered_agent_name || '',
        registered_agent_address: business?.registered_agent_address || '',
    });

    const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: business?.id, ...form });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900">
                {business ? 'Edit Business' : 'Add New Business'}
            </h2>

            {/* Row 1: Name + Industry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Business Name <span className="text-red-500">*</span></label>
                    <input type="text" value={form.name} onChange={set('name')} className={INPUT_CLASS} placeholder="e.g. Acme Corp LLC" required />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Industry</label>
                    <input type="text" value={form.industry} onChange={set('industry')} className={INPUT_CLASS} placeholder="e.g. Technology, Retail, Healthcare" />
                </div>
            </div>

            {/* Row 2: EIN + State of Registration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>EIN (Employer Identification Number)</label>
                    <input type="text" value={form.ein} onChange={set('ein')} className={INPUT_CLASS} placeholder="XX-XXXXXXX" maxLength={10} />
                </div>
                <div>
                    <label className={LABEL_CLASS}>State of Registration</label>
                    <select value={form.state_of_registration} onChange={set('state_of_registration')} className={INPUT_CLASS}>
                        <option value="">Select state…</option>
                        {US_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 3: Address */}
            <div>
                <label className={LABEL_CLASS}>Business Address</label>
                <input type="text" value={form.address} onChange={set('address')} className={INPUT_CLASS} placeholder="123 Main St, Suite 100, City, State, ZIP" />
            </div>

            {/* Row 4: Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Phone Number</label>
                    <input type="tel" value={form.phone} onChange={set('phone')} className={INPUT_CLASS} placeholder="(555) 555-5555" />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Email</label>
                    <input type="email" value={form.email} onChange={set('email')} className={INPUT_CLASS} placeholder="info@company.com" />
                </div>
            </div>

            {/* Row 5: Point of Contact */}
            <div>
                <label className={LABEL_CLASS}>Point of Contact</label>
                <input type="text" value={form.point_of_contact} onChange={set('point_of_contact')} className={INPUT_CLASS} placeholder="Full name and title of primary contact" />
            </div>

            {/* Row 6: Registered Agent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Registered Agent Name</label>
                    <input type="text" value={form.registered_agent_name} onChange={set('registered_agent_name')} className={INPUT_CLASS} placeholder="e.g. John Smith or CT Corporation" />
                </div>
                <div>
                    <label className={LABEL_CLASS}>Registered Agent Address</label>
                    <input type="text" value={form.registered_agent_address} onChange={set('registered_agent_address')} className={INPUT_CLASS} placeholder="123 Agent St, City, State, ZIP" />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                    {business ? 'Save Changes' : 'Add Business'}
                </button>
            </div>
        </form>
    );
}

function BusinessCard({
    business,
    onEdit,
    onDelete,
}: {
    business: Business;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const details = [
        { label: 'EIN', value: business.ein },
        { label: 'Address', value: business.address },
        { label: 'Phone', value: business.phone },
        { label: 'Email', value: business.email },
        { label: 'State of Registration', value: business.state_of_registration },
        { label: 'Point of Contact', value: business.point_of_contact },
        { label: 'Registered Agent', value: business.registered_agent_name },
        { label: 'Registered Agent Address', value: business.registered_agent_address },
    ].filter((d) => d.value);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{business.name}</p>
                        {business.industry && (
                            <p className="text-sm text-gray-500">{business.industry}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {details.length > 0 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title={expanded ? 'Collapse' : 'Expand'}
                        >
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                    <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Edit">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {expanded && details.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-gray-100 pt-4">
                    {details.map(({ label, value }) => (
                        <div key={label}>
                            <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                            <p className="text-sm text-gray-900">{value}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
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
        mutationFn: (updatedBusiness: Partial<Business>) =>
            api.put(`/users/businesses/${updatedBusiness.id}`, updatedBusiness),
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
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl border bg-gray-100" />
                ))}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
                        <p className="text-gray-600 mt-1">Manage your registered business entities.</p>
                    </div>
                    {!isCreating && !editingBusiness && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Business
                        </button>
                    )}
                </div>

                {/* Form */}
                {(isCreating || editingBusiness) && (
                    <BusinessForm
                        business={editingBusiness}
                        onSave={handleSave}
                        onCancel={() => {
                            setIsCreating(false);
                            setEditingBusiness(undefined);
                        }}
                    />
                )}

                {/* List */}
                {businesses && businesses.length > 0 ? (
                    <div className="space-y-3">
                        {businesses.map((business) => (
                            <BusinessCard
                                key={business.id}
                                business={business}
                                onEdit={() => {
                                    setIsCreating(false);
                                    setEditingBusiness(business);
                                }}
                                onDelete={() => deleteMutation.mutate(business.id)}
                            />
                        ))}
                    </div>
                ) : (
                    !isCreating && (
                        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
                            <Building2 className="mx-auto w-10 h-10 text-gray-300" />
                            <p className="mt-3 font-medium text-gray-700">No businesses yet</p>
                            <p className="mt-1 text-sm text-gray-500">Add your first business entity to get started.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add Business
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
