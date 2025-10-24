export default function MenuItemCard({ item, onAdd }) {
  return (
    <div style={styles.card}>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          style={styles.img}
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
      ) : null}
      <div>
        <h3 style={{ margin: '8px 0 0' }}>{item.name}</h3>
        <small style={{ color: '#666' }}>{item.category || 'Other'}</small>
        <p style={{ marginTop: 8 }}>{item.description}</p>
      </div>
      <div style={styles.row}>
        <strong>${item.price.toFixed(2)}</strong>
        <button onClick={() => onAdd(item)} style={styles.btn}>Add</button>
      </div>
    </div>
  );
}

const styles = {
  card: { border: '1px solid #eee', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 },
  img: { width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, background: '#f6f6f6' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btn: { padding: '6px 12px', borderRadius: 8, border: '1px solid #333', cursor: 'pointer' }
};