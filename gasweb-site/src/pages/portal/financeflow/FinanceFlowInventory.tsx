import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  BarChart3,
  Truck,
  ShoppingCart,
} from 'lucide-react';

export default function FinanceFlowInventory() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/portal/financeflow"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          FinanceFlow
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-900">Inventory</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track stock levels, manage purchase orders, and sync with your POS system.
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Package className="mx-auto w-14 h-14 text-amber-400" />
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Coming Soon</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          Inventory management is currently in development. Track products, manage stock
          levels, set reorder points, and integrate with your point-of-sale system.
        </p>
      </div>

      {/* Feature preview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[
          {
            icon: Package,
            label: 'Product Tracking',
            description: 'Track SKUs, stock levels, and product variants across locations.',
            color: 'bg-amber-50',
            textColor: 'text-amber-600',
          },
          {
            icon: Truck,
            label: 'Purchase Orders',
            description: 'Create POs, track deliveries, and manage vendor relationships.',
            color: 'bg-blue-50',
            textColor: 'text-blue-600',
          },
          {
            icon: BarChart3,
            label: 'Reports & Analytics',
            description: 'Inventory valuation, turnover rates, and reorder alerts.',
            color: 'bg-green-50',
            textColor: 'text-green-600',
          },
        ].map(({ icon: Icon, label, description, color, textColor }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <div
              className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}
            >
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{label}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        ))}
      </div>

      {/* POS Integration note */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">POS Integration</h3>
            <p className="text-sm text-slate-500">
              Planned integrations with Square, Shopify, Clover, and Toast for automatic
              inventory sync when sales are made.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
