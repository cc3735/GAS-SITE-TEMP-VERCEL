import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

export default function FoodTruckOrders() {
  return (
    <div>
      <div className="mb-6">
        <Link to="/portal/foodtruck" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> FoodTruck
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Order Tracking</h1>
        <p className="mt-1 text-sm text-slate-500">Track incoming orders and fulfillment status.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Today's Orders</p><p className="text-2xl font-bold text-slate-900">0</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Pending</p><p className="text-2xl font-bold text-slate-900">0</p></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500 mb-1">Today's Revenue</p><p className="text-2xl font-bold text-slate-900">$0</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Orders Yet</h3>
        <p className="text-slate-500 text-sm">Orders will appear here once customers start placing them through your POS or online ordering system.</p>
      </div>
    </div>
  );
}
