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
  const [loading, setLoading] = useState(true);

  // category filter state
  const [selectedCat, setSelectedCat] = useState('All');

  const { addItem, clear, items } = useCart();

  useEffect(() => {
    if (!token) {
      navigate('/?error=missing_token');
      return;
    }
    (async () => {
      try {
        const { data: tableInfo } = await api.get(`/api/table/resolve/${token}`);
        setTable(tableInfo);
        const { data: menuItems } = await api.get('/api/menu');
        setMenu(menuItems);
      } catch (e) {
        navigate('/?error=invalid_token');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  const uniqueCats = useMemo(
    () => ['All', ...Array.from(new Set(menu.map(m => m.category || 'Other')))],
    [menu]
  );

  const filteredMenu = useMemo(
    () =>
      menu.filter(m => selectedCat === 'All' || (m.category || 'Other') === selectedCat),
    [menu, selectedCat]
  );

  const placeOrder = async () => {
    if (!table || items.length === 0) return;
    const payload = {
      table_id: table.table_id,
      items: items.map(it => ({ item_id: it.id, quantity: it.quantity })),
    };
    try {
      await api.post('/api/order', payload);
      clear();
      navigate(`/success?table=${table.table_number}`);
    } catch (e) {
      alert('Failed to place order. Please try again.');
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>;
  if (!table) return null; // navigate already handled errors

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, padding: 20 }}>
      {/* Left: menu + actions */}
      <div>
        <h2 style={{ marginTop: 0 }}>Menu — Table {table.table_number}</h2>

        {/* Category filter chips */}
        <div style={{ display: 'flex', gap: 8, margin: '8px 0 16px' }}>
          {uniqueCats.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                padding: '6px 10px',
                borderRadius: 16,
                border: '1px solid #ddd',
                background: selectedCat === cat ? '#222' : '#fff',
                color: selectedCat === cat ? '#fff' : '#222',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu grid filtered by selected category */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          {filteredMenu.map(item => (
            <MenuItemCard key={item.id} item={item} onAdd={addItem} />
          ))}
        </div>

        <div style={{ marginTop: 24 }}>
          <CallWaiterButton tableId={table.table_id} />
        </div>
      </div>

      {/* Right: cart */}
      <CartDrawer onCheckout={placeOrder} />
    </div>
  );
}

export default function MenuPage() {
  const [search] = useSearchParams();
  const token = search.get('t');
  return (
    <CartProvider token={token || 'unknown'}>
      <InnerMenu />
    </CartProvider>
  );
}