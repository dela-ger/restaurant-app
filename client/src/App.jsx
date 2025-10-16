import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import OrderSuccess from './pages/OrderSuccess';
import AdminDashboard from './pages/AdminDashboard';

function Home() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const error = params.get('error');
  return (
    <div style={{ padding: 24 }}>
      <h1>Restaurant</h1>
      {error === 'missing_token' && <p style={{ color: 'crimson' }}>Missing table token in URL.</p>}
      {error === 'invalid_token' && <p style={{ color: 'crimson' }}>That QR link is not valid.</p>}
      <p>Scan a table QR to open the menu for your table.</p>
      <p><Link to="/admin">Staff dashboard</Link></p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/menu" element={<MenuPage/>} />
        <Route path="/success" element={<OrderSuccess/>} />
        <Route path="/admin" element={<AdminDashboard/>} />
      </Routes>
    </BrowserRouter>
  );
}