export default function MenuItemCard({ item, onAdd }) {
  return (
    <div style={styles.card}>
      <div>
        <h3 style={{ margin: 0 }}>{item.name}</h3>
        <small>{item.category}</small>
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
  card: { border: '1px solid #eee', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btn: { padding: '6px 12px', borderRadius: 8, border: '1px solid #333', cursor: 'pointer' }
};