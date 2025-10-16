import { useEffect, useState } from 'react';
import api from '../api/http';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [stations, setStations] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [o, s] = await Promise.all([
        api.get('/api/order'),           // new backend route below
        api.get('/api/table/stations')
      ]);
      setOrders(o.data);
      setStations(s.data);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const tableName = (tableId) => {
    const match = stations.find(s => s.id === tableId);
    return match ? `Table ${match.table_number}` : `Table ${tableId}`;
    };

  return (
    <div style={{ padding: 20 }}>
      <h2>Orders (last 5s)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th align="left">Table</th><th align="left">Item</th><th>Qty</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{tableName(o.table_id)}</td>
              <td>{o.name}</td>
              <td align="center">{o.quantity}</td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}