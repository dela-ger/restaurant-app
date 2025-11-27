import { useSearchParams, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const table = params.get('table');
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h2> Order sent!</h2>
      <p>Thanks. Your order for table {table} is being prepared.</p>
      <Link to="/">Back to start</Link>
    </div>
  );
}