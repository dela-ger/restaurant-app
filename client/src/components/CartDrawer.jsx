import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';

export default function CartDrawer({ onCheckout }) {
  const { items, updateQty, removeItem, total } = useCart();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(false);

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /** 🟢 MOBILE VIEW **/
  if (isMobile) {
    return (
      <>
        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(true)}
          style={styles.fab(items.length, total)}
        >
          🛒 {items.length} · ${total.toFixed(2)}
        </button>

        {/* Overlay */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            style={styles.overlay}
          />
        )}

        {/* Drawer */}
        <div
          style={{
            ...styles.drawer,
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          <div style={styles.header}>
            <h3 style={{ margin: 0 }}>Your Order</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={styles.closeBtn}
              aria-label="Close cart"
            >
              ×
            </button>
          </div>

          {items.length === 0 ? (
            <p style={{ color: '#666', margin: '12px 0' }}>No items yet.</p>
          ) : (
            <ul style={styles.list}>
              {items.map((it) => (
                <li key={it.id} style={styles.row}>
                  <div style={{ flex: 1 }}>
                    <strong>{it.name}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      ${it.price.toFixed(2)} each
                    </div>
                  </div>
                  <div style={styles.qty}>
                    <button onClick={() => updateQty(it.id, it.quantity - 1)}>-</button>
                    <span>{it.quantity}</span>
                    <button onClick={() => updateQty(it.id, it.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeItem(it.id)} style={styles.remove}>×</button>
                </li>
              ))}
            </ul>
          )}

          <div style={styles.footer}>
            <strong>Total: ${total.toFixed(2)}</strong>
            <button
              disabled={!items.length}
              onClick={() => {
                onCheckout();
                setIsOpen(false);
              }}
              style={{
                ...styles.cta,
                opacity: items.length ? 1 : 0.6,
                pointerEvents: items.length ? 'auto' : 'none',
              }}
            >
              Place order
            </button>
          </div>
        </div>
      </>
    );
  }

  /** 🖥 DESKTOP VIEW **/
  return (
    <div style={styles.sidebar}>
      <h3>Your Order</h3>
      {items.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <ul style={styles.list}>
          {items.map((it) => (
            <li key={it.id} style={styles.row}>
              <div style={{ flex: 1 }}>
                <strong>{it.name}</strong>
                <div style={{ fontSize: 12, color: '#666' }}>
                  ${it.price.toFixed(2)} each
                </div>
              </div>
              <div style={styles.qty}>
                <button onClick={() => updateQty(it.id, it.quantity - 1)}>-</button>
                <span>{it.quantity}</span>
                <button onClick={() => updateQty(it.id, it.quantity + 1)}>+</button>
              </div>
              <button onClick={() => removeItem(it.id)} style={styles.remove}>×</button>
            </li>
          ))}
        </ul>
      )}
      <div style={styles.footer}>
        <strong>Total: ${total.toFixed(2)}</strong>
        <button
          disabled={!items.length}
          onClick={onCheckout}
          style={{
            ...styles.cta,
            opacity: items.length ? 1 : 0.6,
            pointerEvents: items.length ? 'auto' : 'none',
          }}
        >
          Place order
        </button>
      </div>
    </div>
  );
}

const styles = {
  /* 🖥 Desktop Sidebar */
  sidebar: {
    position: 'sticky',
    top: 16,
    border: '1px solid #eee',
    borderRadius: 12,
    padding: 16,
    background: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    minWidth: 280,
    maxWidth: 340,
    height: 'fit-content',
  },

  /* 📱 Floating Button */
  fab: (count, total) => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
    background: '#222',
    color: '#fff',
    border: 'none',
    borderRadius: 50,
    padding: '12px 18px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
    zIndex: 1100,
    transition: 'all 0.2s ease-in-out',
  }),

  /* 📱 Overlay */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
  },

  /* 📱 Drawer */
  drawer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    background: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.15)',
    padding: '16px 20px 80px',
    maxHeight: '80vh',
    overflowY: 'auto',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 1001,
    boxSizing: 'border-box',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 28,
    cursor: 'pointer',
    color: '#333',
    lineHeight: 1,
    padding: 0,
  },

  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px dashed #eee',
  },

  qty: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  remove: {
    border: 'none',
    background: '#eee',
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 16,
  },

  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 10,
    paddingBottom: 1000,
    borderTop: '1px solid #eee',
  },

  cta: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#222',
    color: '#fff',
    cursor: 'pointer',
  },
};
