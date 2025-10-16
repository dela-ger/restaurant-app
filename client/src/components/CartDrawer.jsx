import { useCart } from '../context/CartContext';

export default function CartDrawer({ onCheckout }) {
  const { items, updateQty, removeItem, total } = useCart();

  return (
    <div style={styles.wrap}>
      <h3>Your Order</h3>
      {items.length === 0 ? <p>No items yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map(it => (
            <li key={it.id} style={styles.row}>
              <div style={{ flex: 1 }}>
                <strong>{it.name}</strong>
                <div style={{ fontSize: 12, color: '#666' }}>${it.price.toFixed(2)} each</div>
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
        <button disabled={!items.length} onClick={onCheckout} style={styles.cta}>Place order</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { position: 'sticky', top: 16, border: '1px solid #eee', borderRadius: 10, padding: 14, minWidth: 280 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px dashed #eee' },
  qty: { display: 'flex', alignItems: 'center', gap: 8 },
  remove: { border: 'none', background: '#eee', width: 28, height: 28, borderRadius: 6, cursor: 'pointer' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  cta: { padding: '8px 14px', borderRadius: 8, border: '1px solid #333', cursor: 'pointer' }
};