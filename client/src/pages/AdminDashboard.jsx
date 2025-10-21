import { useEffect, useState } from 'react';
import api from '../api/http';

const NEXT_STEPS = {
  pending:    ['accepted', 'cancelled'],
  accepted:   ['preparing', 'cancelled'],
  preparing:  ['served', 'cancelled'],
  served:     [],
  cancelled:  [],
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stations, setStations] = useState([]);

  const load = async () => {
    const [o, s] = await Promise.all([
      api.get('/api/order'),
      api.get('/api/table/stations')
    ]);
    setOrders(o.data);
    setStations(s.data);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const tableName = (tableId) => {
    const match = stations.find(s => s.id === tableId);
    return match ? `Table ${match.table_number}` : `Table ${tableId}`;
  };

  const advance = async (order, nextStatus) => {
    // optimistic update
    const prev = orders;
    const optimistic = orders.map(o => o.id === order.id ? { ...o, status: nextStatus } : o);
    setOrders(optimistic);

    try {
      const { data } = await api.patch(`/api/order/${order.id}`, { status: nextStatus });
      // reconcile with server (in case of price/name changes etc.)
      setOrders(curr => curr.map(o => o.id === order.id ? data : o));
    } catch {
      // rollback on failure
      setOrders(prev);
      alert('Failed to update status');
    }
  };

  const badge = (status) => ({
    padding: '2px 8px', borderRadius: 12, fontSize: 12,
    background: {
      pending:   '#eee',
      accepted:  '#d1e7dd',
      preparing: '#fff3cd',
      served:    '#cfe2ff',
      cancelled: '#f8d7da',
    }[status] || '#eee',
    border: '1px solid rgba(0,0,0,0.1)'
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Orders</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th align="left">Table</th><th align="left">Item</th><th>Qty</th><th>Status</th><th align="left">Next</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const steps = NEXT_STEPS[o.status] || [];
            return (
              <tr key={o.id} style={{ borderTop: '1px solid #eee' }}>
                <td>{tableName(o.table_id)}</td>
                <td>{o.name}</td>
                <td align="center">{o.quantity}</td>
                <td><span style={badge(o.status)}>{o.status}</span></td>
                <td>
                  {steps.length === 0 ? <em>—</em> : steps.map(s => (
                    <button key={s} onClick={() => advance(o, s)}
                      style={{ marginRight: 6, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}