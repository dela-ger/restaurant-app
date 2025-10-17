import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/http';
import { CartProvider, useCart } from '../context/CartContext';
import MenuItemCard from '../components/MenuItemCard';
import CartDrawer from '../components/CartDrawer';
import CallWaiterButton from '../components/CallWaiterButton';

function InnerMenu() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = search.get('t');
  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);

  const { addItem, clear, items } = useCart();

  useEffect(() => {
    if (!token) return navigate('/?error=missing_token');
    (async () => {
      try {
        const { data: tableInfo } = await api.get(`/api/table/resolve/${token}`);
        setTable(tableInfo);
        const { data: menuItems } = await api.get('/api/menu');
        setMenu(menuItems);
      } catch  {
        navigate('/?error=invalid_token');
      }
    })();
  }, [token, navigate]);

  const placeOrder = async () => {
    if (!table) return;
    const payload = {
      table_id: table.table_id,
      items: items.map(it => ({ item_id: it.id, quantity: it.quantity }))
    };
    try {
      await api.post('/api/order', payload);
      clear();
      navigate(`/success?table=${table.table_number}`);
    } catch {
      alert('Failed to place order. Please try again.');
    }
  };

  const categories = useMemo(() => {
    const map = new Map();
    menu.forEach(m => {
      const key = m.category || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return Array.from(map.entries());
  }, [menu]);

  if (!table) return <p style={{ padding: 20 }}>Loading table…</p>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, padding: 20 }}>
      <div>
        <h2>Menu — Table {table.table_number}</h2>
        {categories.map(([cat, items]) => (
          <section key={cat} style={{ marginBottom: 24 }}>
            <h3>{cat}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {items.map(item => (
                <MenuItemCard key={item.id} item={item} onAdd={addItem} />
              ))}
            </div>
          </section>
        ))}
        <div style={{ marginTop: 24 }}>
          <CallWaiterButton tableId={table.table_id} />
        </div>
      </div>

      <CartDrawer onCheckout={placeOrder} />
    </div>
  );
}

export default function MenuPageWrapper() {
  const [search] = useSearchParams();
  const token = search.get('t');
  return (
    <CartProvider token={token || 'unknown'}>
      <InnerMenu />
    </CartProvider>
  );
}