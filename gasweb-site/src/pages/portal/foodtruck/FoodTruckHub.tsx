import { Link } from 'react-router-dom';
import { UtensilsCrossed, ShoppingCart, MapPin, Package, ArrowRight } from 'lucide-react';

const FEATURES = [
  { slug: 'menu', label: 'Menu Management', description: 'Create and manage your menu items, categories, and pricing.', icon: UtensilsCrossed, color: 'bg-orange-50', textColor: 'text-orange-600' },
  { slug: 'orders', label: 'Order Tracking', description: 'Track incoming orders, order history, and fulfillment status.', icon: ShoppingCart, color: 'bg-green-50', textColor: 'text-green-600' },
  { slug: 'locations', label: 'Location Schedule', description: 'Plan your route, manage locations, and set operating hours.', icon: MapPin, color: 'bg-blue-50', textColor: 'text-blue-600' },
  { slug: 'inventory', label: 'Inventory', description: 'Track ingredient stock levels, costs, and reorder alerts.', icon: Package, color: 'bg-purple-50', textColor: 'text-purple-600' },
] as const;

export default function FoodTruckHub() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">FoodTruck</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your food truck business — menus, orders, locations, and inventory.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {FEATURES.map(({ slug, label, description, icon: Icon, color, textColor }) => (
          <Link key={slug} to={`/portal/foodtruck/${slug}`}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${textColor}`} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">{label}</h2>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${textColor}`}>
              Open <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
