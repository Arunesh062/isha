import { useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Package, Save, ShieldAlert, ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/data/products';
import { useCatalogue } from '@/store/CatalogueContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthContext';

import type { InventoryRow, AdminOrder } from '@/types';

interface AdminPageProps { onNavigate: (page: string) => void; }

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { profile, loading: authLoading } = useAuth();
  const { products } = useCatalogue();
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin') { setLoading(false); return; }
    Promise.all([
      supabase.from('catalog_products').select('product_id, stock, unit_price').order('product_id'),
      supabase.from('orders').select('id, status, total, created_at, customer_name, city').order('created_at', { ascending: false }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
    ]).then(([inventoryResult, ordersResult, countResult]) => {
      if (inventoryResult.error || ordersResult.error || countResult.error) {
        setFetchError('Could not load dashboard data. Please check your connection and try again.');
        setLoading(false);
        return;
      }
      setInventory((inventoryResult.data ?? []) as InventoryRow[]);
      setOrders((ordersResult.data ?? []) as AdminOrder[]);
      setOrdersCount(countResult.count ?? 0);
      setLoading(false);
    }).catch(() => {
      setFetchError('An unexpected error occurred while loading the dashboard.');
      setLoading(false);
    });
  }, [profile]);

  const saveProduct = async (productId: string, stock: number, unitPrice: number) => {
    if (!Number.isInteger(stock) || stock < 0 || !Number.isFinite(unitPrice) || unitPrice < 0) return;
    const { error } = await supabase.from('catalog_products').update({ stock, unit_price: unitPrice }).eq('product_id', productId);
    setMessage(error ? 'Could not update the product.' : 'Product updated successfully.');
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) { setMessage('Could not update the order.'); return; }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
    setMessage('Order status updated successfully.');
  };

  if (authLoading || loading) return <section className="bg-cream py-20 text-center"><p className="text-sm text-primary-500">Loading admin dashboard…</p></section>;
  if (profile?.role !== 'admin') return <section className="bg-cream py-20 text-center"><div className="container-custom"><ShieldAlert className="mx-auto h-12 w-12 text-primary-500" /><h1 className="mt-4 font-serif text-3xl font-semibold text-primary-900">Admin access required</h1><p className="mx-auto mt-2 max-w-md text-sm text-primary-600">This area is restricted to authorised store administrators.</p><button onClick={() => onNavigate('home')} className="mt-6 rounded-sm bg-primary-700 px-7 py-3 text-sm font-medium text-white">Return home</button></div></section>;
  if (fetchError) return <section className="bg-cream py-20 text-center"><div className="container-custom"><AlertTriangle className="mx-auto h-12 w-12 text-accent-500" /><h1 className="mt-4 font-serif text-3xl font-semibold text-primary-900">Dashboard error</h1><p className="mx-auto mt-2 max-w-md text-sm text-primary-600">{fetchError}</p><button onClick={() => window.location.reload()} className="mt-6 rounded-sm bg-primary-700 px-7 py-3 text-sm font-medium text-white">Reload</button></div></section>;

  return (
    <section className="bg-cream py-10 md:py-14">
      <div className="container-custom">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-500">Store management</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-primary-900">Admin dashboard</h1>
          </div>
          {message && <p className="text-sm text-sage-700">{message}</p>}
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-sm bg-white p-5 shadow-sm">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <p className="mt-4 text-xs uppercase tracking-wide text-primary-500">Catalogue items</p>
            <p className="mt-1 text-2xl font-semibold text-primary-900">{inventory.length}</p>
          </div>
          <div className="rounded-sm bg-white p-5 shadow-sm">
            <ShoppingCart className="h-5 w-5 text-primary-600" />
            <p className="mt-4 text-xs uppercase tracking-wide text-primary-500">Orders received</p>
            <p className="mt-1 text-2xl font-semibold text-primary-900">{ordersCount}</p>
          </div>
          <div className="rounded-sm bg-white p-5 shadow-sm">
            <Package className="h-5 w-5 text-primary-600" />
            <p className="mt-4 text-xs uppercase tracking-wide text-primary-500">Low stock items</p>
            <p className="mt-1 text-2xl font-semibold text-primary-900">{inventory.filter((item) => item.stock < 10).length}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm bg-white shadow-sm">
          <div className="border-b border-primary-100 px-5 py-4">
            <h2 className="font-serif text-2xl font-semibold text-primary-900">Inventory management</h2>
          </div>
          <div className="divide-y divide-primary-100">
            {inventory.map((item) => {
              const product = products.find((candidate) => candidate.id === item.product_id);
              return (
                <div key={item.product_id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <img src={product?.image} alt="" className="h-12 w-12 rounded-sm object-cover" />
                    <div>
                      <p className="text-sm font-medium text-primary-900">{product?.name ?? item.product_id}</p>
                      <p className="text-xs text-primary-500">{formatPrice(item.unit_price)} · ID {item.product_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      aria-label={`Stock for ${product?.name ?? item.product_id}`}
                      type="number"
                      min="0"
                      value={item.stock}
                      onChange={(e) => setInventory((current) => current.map((row) => row.product_id === item.product_id ? { ...row, stock: Number(e.target.value) } : row))}
                      className="w-24 rounded-sm border border-primary-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                    />
                    <button
                      onClick={() => saveProduct(item.product_id, item.stock, item.unit_price)}
                      className="inline-flex items-center gap-1.5 rounded-sm bg-primary-700 px-3 py-2 text-xs font-medium text-white hover:bg-primary-800"
                    >
                      <Save className="h-3.5 w-3.5" /> Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-sm bg-white shadow-sm">
          <div className="border-b border-primary-100 px-5 py-4">
            <h2 className="font-serif text-2xl font-semibold text-primary-900">Recent orders</h2>
          </div>
          {orders.length === 0 ? (
            <p className="p-5 text-sm text-primary-500">No orders received yet.</p>
          ) : (
            <div className="divide-y divide-primary-100">
              {orders.map((order) => (
                <div key={order.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-primary-500">{order.customer_name} · {order.city} · Placed {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary-900">{formatPrice(Number(order.total))}</span>
                    <select
                      aria-label={`Status for order ${order.id}`}
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="rounded-sm border border-primary-200 px-3 py-1.5 text-xs font-medium capitalize text-primary-900 outline-none focus:border-primary-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
