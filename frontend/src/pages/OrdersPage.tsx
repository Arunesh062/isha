import { useEffect, useState } from 'react';
import { AlertTriangle, Package, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/data/products';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthContext';

import type { Order } from '@/types';

interface OrdersPageProps { onNavigate: (page: string) => void; }

export default function OrdersPage({ onNavigate }: OrdersPageProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, status, total, created_at, customer_name, city')
          .order('created_at', { ascending: false });

        if (error) {
          setFetchError('Could not load your orders. Please try again later.');
          return;
        }

        setOrders((data ?? []) as Order[]);
      } catch {
        setFetchError('An unexpected error occurred while loading orders.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user]);
  if (!user) return <section className="bg-cream py-20 text-center"><div className="container-custom"><Package className="mx-auto h-12 w-12 text-primary-500" /><h1 className="mt-4 font-serif text-3xl font-semibold text-primary-900">Sign in to see your orders</h1><button onClick={() => onNavigate('account')} className="mt-6 rounded-sm bg-primary-700 px-7 py-3 text-sm font-medium text-white">Open account</button></div></section>;
  if (fetchError) return <section className="bg-cream py-20 text-center"><div className="container-custom"><AlertTriangle className="mx-auto h-12 w-12 text-accent-500" /><h1 className="mt-4 font-serif text-3xl font-semibold text-primary-900">Something went wrong</h1><p className="mx-auto mt-2 max-w-md text-sm text-primary-600">{fetchError}</p><button onClick={() => window.location.reload()} className="mt-6 rounded-sm bg-primary-700 px-7 py-3 text-sm font-medium text-white">Reload</button></div></section>;
  return <section className="bg-cream py-10 md:py-14"><div className="container-custom"><div className="mb-8"><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-500">Your account</p><h1 className="mt-2 font-serif text-4xl font-semibold text-primary-900">Order history</h1></div>{loading ? <p className="text-sm text-primary-500">Loading your orders…</p> : orders.length === 0 ? <div className="rounded-sm bg-white p-12 text-center shadow-sm"><ShoppingBag className="mx-auto h-10 w-10 text-primary-400" /><h2 className="mt-4 font-serif text-2xl font-semibold text-primary-900">No orders yet</h2><button onClick={() => onNavigate('shop:all')} className="mt-5 rounded-sm bg-primary-700 px-6 py-3 text-sm font-medium text-white">Start shopping</button></div> : <div className="space-y-4">{orders.map((order) => <div key={order.id} className="rounded-sm bg-white p-5 shadow-sm md:flex md:items-center md:justify-between"><div><p className="text-xs text-primary-500">Placed {new Date(order.created_at).toLocaleDateString('en-IN')}</p><h2 className="mt-1 font-serif text-xl font-semibold text-primary-900">Order #{order.id.slice(0, 8).toUpperCase()}</h2><p className="mt-1 text-sm text-primary-600">Delivering to {order.city} · {order.customer_name}</p></div><div className="mt-4 flex items-center gap-5 md:mt-0"><span className="rounded-full bg-sage-50 px-3 py-1.5 text-xs font-medium capitalize text-sage-700">{order.status}</span><span className="font-semibold text-primary-900">{formatPrice(Number(order.total))}</span></div></div>)}</div>}</div></section>;
}
