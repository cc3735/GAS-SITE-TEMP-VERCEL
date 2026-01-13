/**
 * Transaction Management Page
 *
 * Filterable table of transactions with inline categorization
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface Transaction {
    id: string;
    date: string;
    name: string;
    amount: number;
    merchant_name?: string;
    category_id?: string;
    transaction_categories?: {
        name: string;
        category_type: string;
        tax_deductible: boolean;
    };
    linked_account_id: string;
}

interface Category {
    id: string;
    name: string;
}

export default function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        searchQuery: '',
        categoryId: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchTransactions();
        fetchCategories();
    }, [filters]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (filters.searchQuery) queryParams.append('searchQuery', filters.searchQuery);
            if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const response = await fetch(`/api/bookkeeping/transactions?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/bookkeeping/categories', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Flatten categories for dropdown
                const flattened: Category[] = [];
                const processCats = (cats: any[]) => {
                    cats.forEach(c => {
                        flattened.push({ id: c.id, name: c.name });
                        if (c.children) processCats(c.children);
                    });
                };
                processCats(data.data);
                setCategories(flattened);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleCategoryChange = async (transactionId: string, categoryId: string) => {
        try {
            // Optimistic update
            setTransactions(prev => prev.map(t =>
                t.id === transactionId
                    ? { ...t, category_id: categoryId, transaction_categories: { ...t.transaction_categories!, name: categories.find(c => c.id === categoryId)?.name || '' } }
                    : t
            ));

            await fetch(`/api/bookkeeping/transactions/${transactionId}/category`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ categoryId }),
            });
        } catch (error) {
            console.error('Error updating category:', error);
            fetchTransactions(); // Revert on error
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/bookkeeping" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                            <p className="text-gray-600">Review and categorize your expenses</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filters.searchQuery}
                                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                            />
                        </div>

                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filters.categoryId}
                            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />

                        <input
                            type="date"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading transactions...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(txn.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{txn.name}</div>
                                                {txn.merchant_name && (
                                                    <div className="text-xs text-gray-500">{txn.merchant_name}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                    value={txn.category_id || ''}
                                                    onChange={(e) => handleCategoryChange(txn.id, e.target.value)}
                                                >
                                                    <option value="">Uncategorized</option>
                                                    {categories.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${txn.amount < 0 ? 'text-gray-900' : 'text-green-600'
                                                }`}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(txn.amount))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {txn.transaction_categories?.tax_deductible && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Deductible
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
