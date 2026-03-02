/**
 * Bookkeeping Reports Page
 *
 * Financial reports including P&L statements, category breakdowns,
 * and tax deduction summaries
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportData {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    totalTaxDeductible: number;
    categoryBreakdown: Record<string, number>;
    monthlyBreakdown: Array<{
        month: string;
        income: number;
        expenses: number;
        net: number;
    }>;
    deductibleByCategory: Array<{
        name: string;
        amount: number;
        percentage: number;
    }>;
    taxCategories: Record<string, number>;
    dateRange: {
        start: string;
        end: string;
    };
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // January 1st of current year
        endDate: new Date().toISOString().split('T')[0], // Today
    });
    const [reportType, setReportType] = useState<'all' | 'income' | 'expenses' | 'deductible'>('all');

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            queryParams.append('startDate', dateRange.startDate);
            queryParams.append('endDate', dateRange.endDate);

            const response = await fetch(`/api/bookkeeping/summary?${queryParams}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setReportData(data.data);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
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

    const formatPercent = (part: number, total: number) => {
        if (total === 0) return '0%';
        return ((part / total) * 100).toFixed(1) + '%';
    };

    const handleExportPDF = () => {
        // Basic implementation - in production, use a library like jsPDF
        const content = `
PROFIT & LOSS STATEMENT
Period: ${dateRange.startDate} to ${dateRange.endDate}

INCOME
Total Income: ${formatCurrency(reportData?.totalIncome || 0)}

EXPENSES
Total Expenses: ${formatCurrency(reportData?.totalExpenses || 0)}

NET INCOME
${formatCurrency(reportData?.netIncome || 0)}

TAX DEDUCTIBLE EXPENSES
Total: ${formatCurrency(reportData?.totalTaxDeductible || 0)}

CATEGORY BREAKDOWN
${Object.entries(reportData?.categoryBreakdown || {})
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => `${cat}: ${formatCurrency(amount)}`)
    .join('\n')}
        `;
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', `profit-loss-${dateRange.startDate}-to-${dateRange.endDate}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Link to="/bookkeeping" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                    </div>
                    <div className="bg-white p-8 rounded-lg shadow">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/bookkeeping" className="text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
                            <p className="text-gray-600">Analyze your income, expenses, and tax deductions</p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>

                {/* Date Range Selector */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filter</label>
                            <select
                                onChange={(e) => {
                                    const now = new Date();
                                    let start = new Date();
                                    switch (e.target.value) {
                                        case 'ytd':
                                            start = new Date(now.getFullYear(), 0, 1);
                                            break;
                                        case '2025':
                                            start = new Date(2025, 0, 1);
                                            break;
                                        case '30days':
                                            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                                            break;
                                        case '90days':
                                            start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                                            break;
                                    }
                                    setDateRange({
                                        startDate: start.toISOString().split('T')[0],
                                        endDate: now.toISOString().split('T')[0],
                                    });
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select period</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                                <option value="ytd">Year to Date</option>
                                <option value="2025">Full Year 2025</option>
                            </select>
                        </div>
                    </div>
                </div>

                {reportData ? (
                    <>
                        {/* P&L Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {/* Total Income */}
                            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Income</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">
                                            {formatCurrency(reportData.totalIncome)}
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
                                            {formatCurrency(reportData.totalExpenses)}
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
                                        <p className={`text-2xl font-bold mt-1 ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(reportData.netIncome)}
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
                                            {formatCurrency(reportData.totalTaxDeductible)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            {formatPercent(reportData.totalTaxDeductible, reportData.totalExpenses)} of expenses
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-purple-500" />
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Income vs Expenses Chart */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses Overview</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={reportData.monthlyBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                        <Legend />
                                        <Bar dataKey="income" fill="#10b981" name="Income" />
                                        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Net Income Trend */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Income Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={reportData.monthlyBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net Income" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Category Breakdown */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
                                {Object.keys(reportData.categoryBreakdown).length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(reportData.categoryBreakdown)
                                                    .filter(([, amount]) => amount > 0) // Only show positive amounts
                                                    .map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {Object.entries(reportData.categoryBreakdown).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No expense data available</p>
                                )}
                            </div>

                            {/* Tax Deductible Breakdown */}
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deductible Expenses by Category</h3>
                                {reportData.deductibleByCategory && reportData.deductibleByCategory.length > 0 ? (
                                    <div className="space-y-3">
                                        {reportData.deductibleByCategory.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div 
                                                        className="w-3 h-3 rounded-full" 
                                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                    ></div>
                                                    <span className="text-gray-700">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                                                    <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No deductible expenses found</p>
                                )}
                            </div>
                        </div>

                        {/* Category Details Table */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">All Category Breakdown</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Total</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Deductible</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {Object.entries(reportData.categoryBreakdown)
                                            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                                            .map(([category, amount], idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <span className="text-gray-900 font-medium">{category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`font-semibold ${amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                            {formatCurrency(amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-gray-600">
                                                            {formatPercent(Math.abs(amount), reportData.totalExpenses + reportData.totalIncome)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {reportData.taxCategories[category] && reportData.taxCategories[category] > 0 ? (
                                                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                                                ✓ {formatCurrency(reportData.taxCategories[category])}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Tax Preparation Tips</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Keep all receipts for deductible expenses for at least 3-7 years</li>
                                <li>• Review categorization to ensure accuracy for tax filing</li>
                                <li>• Export this report annually for your tax return</li>
                                <li>• Consult with a tax professional to maximize deductions</li>
                            </ul>
                        </div>
                    </>
                ) : (
                    <div className="bg-white p-12 rounded-lg shadow text-center">
                        <p className="text-gray-600 text-lg mb-4">No data available for the selected period</p>
                        <p className="text-gray-500">
                            Add transactions from bank accounts or statements to see your financial reports
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
