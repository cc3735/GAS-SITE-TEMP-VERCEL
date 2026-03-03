/**
 * Bookkeeping Dashboard Page
 *
 * Main bookkeeping interface showing financial summary,
 * recent transactions, and quick actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, TrendingDown, Plus, Upload, RefreshCw, BarChart3, ArrowLeftRight, BookOpen, FileText } from 'lucide-react';

interface FinancialSummary {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    totalTaxDeductible: number;
    categoryBreakdown: Record<string, number>;
    transactionCount: number;
    dateRange: {
        start: string;
        end: string;
    };
}

export default function Bookkeeping() {
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            // Get current month summary
            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const endDate = now.toISOString().split('T')[0];

            const response = await fetch(
                `/api/bookkeeping/summary?startDate=${startDate}&endDate=${endDate}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSummary(data.data);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bookkeeping & Accounting</h1>
                    <p className="text-gray-600 mt-2">
                        Organize your finances for tax preparation
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    <Link
                        to="/bookkeeping/accounts"
                        className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Plus className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Connect Bank Account</h3>
                                <p className="text-sm text-gray-600">Link via Plaid</p>
                            </div>
                        </div>
                    </Link>

                    <button
                        onClick={() => (window.location.href = '/bookkeeping/upload')}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Upload className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Upload Bank Statement</h3>
                                <p className="text-sm text-gray-600">PDF or CSV</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={fetchSummary}
                        className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200 text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <RefreshCw className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Sync Transactions</h3>
                                <p className="text-sm text-gray-600">Update from banks</p>
                            </div>
                        </div>
                    </button>

                    <Link
                        to="/bookkeeping/reports"
                        className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Financial Reports</h3>
                                <p className="text-sm text-gray-600">P&L & Tax Deductions</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/bookkeeping/ap-ar"
                        className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-100 rounded-lg">
                                <ArrowLeftRight className="w-6 h-6 text-teal-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">AP / AR</h3>
                                <p className="text-sm text-gray-600">Bills & Invoices</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Accounting */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Accounting</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            to="/accounting/chart-of-accounts"
                            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 rounded-lg">
                                    <BookOpen className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Chart of Accounts</h3>
                                    <p className="text-sm text-gray-600">Manage accounts</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/accounting/journal-entries"
                            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-violet-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-violet-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Journal Entries</h3>
                                    <p className="text-sm text-gray-600">Record transactions</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Financial Summary */}
                {loading ? (
                    <div className="bg-white p-8 rounded-lg shadow">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ) : summary ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {/* Total Income */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Income</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {formatCurrency(summary.totalIncome)}
                                        </p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-green-500" />
                                </div>
                            </div>

                            {/* Total Expenses */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Expenses</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {formatCurrency(summary.totalExpenses)}
                                        </p>
                                    </div>
                                    <TrendingDown className="w-8 h-8 text-red-500" />
                                </div>
                            </div>

                            {/* Net Income */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Net Income</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {formatCurrency(summary.netIncome)}
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>

                            {/* Tax Deductible */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Tax Deductible</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {formatCurrency(summary.totalTaxDeductible)}
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-purple-500" />
                                </div>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-white p-6 rounded-lg shadow mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Category Breakdown
                            </h2>
                            <div className="space-y-3">
                                {Object.entries(summary.categoryBreakdown)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 10)
                                    .map(([category, amount]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <span className="text-gray-700">{category}</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(amount)}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Transaction Summary */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Recent Transactions
                                </h2>
                                <Link
                                    to="/bookkeeping/transactions"
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View All →
                                </Link>
                            </div>
                            <p className="text-gray-600">
                                {summary.transactionCount} transactions from {summary.dateRange.start} to{' '}
                                {summary.dateRange.end}
                            </p>
                            <Link
                                to="/bookkeeping/transactions"
                                className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Manage Transactions
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <p className="text-gray-600 text-lg mb-4">No financial data yet</p>
                        <p className="text-gray-500 mb-6">
                            Connect a bank account or upload a bank statement to get started
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link
                                to="/bookkeeping/accounts"
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Connect Bank Account
                            </Link>
                            <button
                                onClick={() => (window.location.href = '/bookkeeping/upload')}
                                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Upload Statement
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
