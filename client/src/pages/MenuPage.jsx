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
  const [menuError, setMenuError] = useState(null);

  // category filter state
  const [selectedCat, setSelectedCat] = useState('All');

  const { addItem, clear, items } = useCart();

  useEffect(() => {
    if (!token) {
      navigate('/?error=missing_token');
      return;
    }

    let cancelled = false;

    (async () => {
      // 1) Resolve token — only this controls invalid_token redirect
      try {
        const { data: tableInfo } = await api.get(`/api/table/resolve/${token}`);
        if (cancelled) return;
        setTable(tableInfo);
      } catch (e) {
        if (!cancelled) navigate('/?error=invalid_token');
        return; // stop here if token is invalid
      }

      // 2) Fetch menu — failure should NOT redirect; show message instead
      try {
        const { data: menuItems } = await api.get('/api/menu');
        if (cancelled) return;
        setMenu(menuItems);
        setMenuError(null);
      } catch (e) {
        console.error('Menu load failed:', e);
        if (!cancelled) {
          setMenu([]);                // keep page up
          setMenuError('We couldn’t load the menu. Please try again in a moment.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const uniqueCats = useMemo(
    () => ['All', ...Array.from(new Set(menu.map(m => m.category || 'Other')))],
    [menu]
  );

  const filteredMenu = useMemo(
    () => menu.filter(m => selectedCat === 'All' || (m.category || 'Other') === selectedCat),
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
  if (!table) return null; // token resolver handled redirect

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, padding: 20 }}>
      {/* Left: menu + actions */}
      <div>
        <h2 style={{ marginTop: 0 }}>Menu — Table {table.table_number}</h2>

        {/* Inline error if menu failed but token is valid */}
        {menuError && (
          <p style={{ color: '#b00', margin: '8px 0 16px' }}>{menuError}</p>
        )}


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