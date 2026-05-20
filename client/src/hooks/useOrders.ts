import { useEffect, useState, useCallback } from 'react';
import { useAdminStore } from '../store/adminStore';
import type { Order } from '../store/orderStore';

export function useAdminOrders(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { token } = useAdminStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page) params.set('page', String(filters.page));
      if (filters?.limit) params.set('limit', String(filters.limit || 10));

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { 'X-Admin-Token': token || '' },
      });

      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters?.status, filters?.search, filters?.page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, total, loading, refetch: fetchOrders };
}

export function useAnalytics(range: string) {
  const { token } = useAdminStore();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/analytics?range=${range}`, {
      headers: { 'X-Admin-Token': token || '' },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range, token]);

  return { data, loading };
}
