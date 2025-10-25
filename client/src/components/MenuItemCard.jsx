const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MenuItemCard({ item, onAdd }) {
  // Build full URL if image_url is relative (e.g., "/uploads/xyz.jpg")
  const src = item.image_url
    ? (item.image_url.startsWith('http')
        ? item.image_url
        : `${API_BASE}${item.image_url}`)
    : null;

  return (
    <div style={styles.card}>
      {src ? (
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          style={styles.img}
          onError={(e) => {
            // Comment this out while debugging if you want to see the broken icon

            e.currentTarget.style.visibility = 'hidden';
          }}
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