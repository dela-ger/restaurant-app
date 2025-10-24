import { useEffect, useState } from 'react';
import api from '../api/http';

export default function AdminNewItem() {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', image_url: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    api.get('/api/menu/categories').then(r => setCats(r.data));
  }, []);

  const upload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/api/media/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setForm(f => ({ ...f, image_url: data.url }));
  };

  const save = async () => {
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category_id: form.category_id ? Number(form.category_id) : undefined,
      image_url: form.image_url || undefined
    };
    await api.post('/api/menu', payload);
    alert('Created!');
  };

  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>New Menu Item</h2>
      <label>Name<br/><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><br/><br/>
      <label>Description<br/><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><br/><br/>
      <label>Price<br/><input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label><br/><br/>
      <label>Category<br/>
        <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
          <option value="">(none)</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label><br/><br/>
      <label>Image<br/>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={upload} disabled={!file} style={{ marginLeft: 8 }}>Upload</button>
      </label>
      {form.image_url && <div style={{ marginTop: 10 }}><img src={form.image_url} alt="preview" style={{ width: 200, borderRadius: 8 }} /></div>}
      <br/>
      <button onClick={save}>Save item</button>
    </div>
  );
}