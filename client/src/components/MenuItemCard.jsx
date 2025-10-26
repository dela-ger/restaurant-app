const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MenuItemCard({ item, onAdd }) {
  const src = item.image_url
    ? item.image_url.startsWith('http')
      ? item.image_url
      : `${API_BASE}${item.image_url}`
    : null;

  return (
    <div style={styles.card}>
      {src ? (
        <img
          src={src}
          alt={item.name}
          loading="lazy"
          style={styles.img}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      ) : (
        <div style={styles.placeholder}>No image</div>
      )}

      <div style={styles.content}>
        <h3 style={styles.name}>{item.name}</h3>
        <small style={styles.category}>{item.category || 'Other'}</small>
        <p style={styles.desc}>{item.description}</p>
      </div>

      <div style={styles.footer}>
        <strong style={styles.price}>${item.price.toFixed(2)}</strong>
        <button onClick={() => onAdd(item)} style={styles.btn}>Add</button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #eee',
    borderRadius: 12,
    backgroundColor: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    padding: 14,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
  },
  img: {
    width: '100%',
    height: 'auto',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    borderRadius: 10,
    background: '#f6f6f6',
  },
  placeholder: {
    width: '100%',
    aspectRatio: '4 / 3',
    borderRadius: 10,
    background: '#f6f6f6',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
  },
  content: {
    marginTop: 10,
    flex: 1,
  },
  name: {
    margin: '0 0 4px',
    fontSize: '1rem',
    lineHeight: 1.2,
    wordBreak: 'break-word',
  },
  category: {
    color: '#777',
    fontSize: 13,
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.5,
    color: '#444',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: 600,
  },
  btn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#222',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'background 0.2s ease',
  },
};
