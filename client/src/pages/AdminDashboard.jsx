import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/http';
import { socket } from '../lib/socket';

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
  const [busy, setBusy] = useState(false);

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
    const prev = orders;
    const optimistic = orders.map(o => o.id === order.id ? { ...o, status: nextStatus } : o);
    setOrders(optimistic);
    try {
      const { data } = await api.patch(`/api/order/${order.id}`, { status: nextStatus });
      setOrders(curr => curr.map(o => o.id === order.id ? data : o));
    } catch {
      setOrders(prev);
      alert('Failed to update status');
    }
  };

  // bulk clear served+cancelled
  const clearServedCancelled = async () => {
    if (!confirm('Clear all SERVED and CANCELLED orders?')) return;
    try {
      setBusy(true);
      await api.delete('/api/order/cleanup', { params: { status: 'served,cancelled' } });
      await load();
    } catch {
      alert('Failed to clear orders');
    } finally {
      setBusy(false);
    }
  };

  // clear ALL (careful!)
  const clearAll = async () => {
    if (!confirm('This will delete ALL orders. Continue?')) return;
    try {
      setBusy(true);
      await api.delete('/api/order/cleanup', { params: { all: true } });
      await load();
    } catch {
      alert('Failed to clear orders');
    } finally {
      setBusy(false);
    }
  };

  // optional: remove one whole order (requires each row to have order_id)
  const removeOrder = async (order) => {
    const orderId = order.order_id || order.id; // prefer order.order_id if provided by backend
    if (!orderId) return alert('No order id on row');
    if (!confirm(`Remove order #${orderId}?`)) return;
    try {
      setBusy(true);
      await api.delete(`/api/order/${orderId}`);
      // optimistically remove all rows for that order
      setOrders(curr => curr.filter(o => (o.order_id || o.id) !== orderId));
    } catch {
      alert('Failed to remove order');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onNew = () => load();
    const onStatus = ({ id, status}) => 
      setOrders(curr => curr.map(o => (o.id === id ? { ...o, status } : o )));

    socket.on('order:new', onNew);
    socket.on('order:status', onStatus);

    return () => {
      socket.off('order:new', onNew);
      socket.off('order:status', onStatus);   
    }
  }, []);

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

      {/* toolbar */}
      <div style={{ margin: '8px 0 16px', display: 'flex', gap: 8 }}>
        <button onClick={clearServedCancelled} disabled={busy}
          style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
          Clear served/cancelled
        </button>
        <button onClick={clearAll} disabled={busy}
          style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer', borderColor: '#b00', color: '#b00' }}>
          Clear ALL
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th align="left">Table</th><th align="left">Item</th><th>Qty</th><th>Status</th><th align="left">Next</th><th>Actions</th></tr>
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
                <td>
                  <button onClick={() => removeOrder(o)} disabled={busy}
                    title="Remove whole order"
                    style={{ padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
          {!orders.length && (
            <tr><td colSpan={6} style={{ padding: 16, color: '#666' }}><em>No orders.</em></td></tr>
          )}
        </tbody>
      </table>

      <Link to="/admin/new-item">Add new item to the menu here...</Link>
    </div>
  );
}