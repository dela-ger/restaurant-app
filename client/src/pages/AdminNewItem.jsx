import { useEffect, useMemo, useState } from 'react';
import api from '../api/http';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminNewItem() {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    category: '',        // <-- free-text fallback
    image_url: '',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // load categories (may return empty [])
  useEffect(() => {
    let mounted = true;
    api.get('/api/menu/categories')
      .then(r => { if (mounted) setCats(r.data || []); })
      .catch(() => { if (mounted) setCats([]); });
    return () => { mounted = false; };
  }, []);

  const hasCategories = cats && cats.length > 0;

  const previewSrc = useMemo(() => {
    if (!form.image_url) return '';
    return form.image_url.startsWith('http')
      ? form.image_url
      : `${API_BASE}${form.image_url}`;
  }, [form.image_url]);

  const upload = async () => {
    try {
      setError('');
      if (!file) return;
      setUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/api/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, image_url: data.url }));
    } catch (e) {
      setError(e?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    try {
      setError('');
      setSaving(true);
      const priceNum = Number(form.price);
      if (!form.name?.trim() || Number.isNaN(priceNum)) {
        setError('Name and price are required.');
        return;
      }

      // Build payload with either category_id OR category (free text)
      const payload = {
        name: form.name.trim(),
        description: form.description,
        price: priceNum,
        ...(hasCategories
          ? (form.category_id ? { category_id: Number(form.category_id) } : {})
          : (form.category ? { category: form.category.trim() } : {})
        ),
        ...(form.image_url ? { image_url: form.image_url } : {}),
      };

      const { data } = await api.post('/api/menu', payload);
      alert(`Created: ${data.name}`);
      setForm({ name: '', description: '', price: '', category_id: '', category: '', image_url: '' });
      setFile(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  // require image for save to avoid nulls
  const canSave =
    !!form.name?.trim() &&
    !!form.price &&
    !!form.image_url &&
    !uploading &&
    !saving &&
    (hasCategories ? true : !!form.category?.trim());


  return (
    <div style={{ padding: 20, maxWidth: 520 }}>
      <h2>New Menu Item</h2>

      {error && (
        <div style={{ background: '#ffecec', color: '#900', padding: 10, borderRadius: 8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <label>
        Name<br />
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Caesar Salad"
          style={{ width: '100%' }}
        />
      </label>
      <br /><br />

      <label>
        Description<br />
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Short description"
          rows={3}
          style={{ width: '100%' }}
        />
      </label>
      <br /><br />

      <label>
        Price<br />
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
          placeholder="9.99"
          style={{ width: '100%' }}
        />
      </label>
      <br /><br />

      {/* Category UI: dropdown if we have categories, else free-text input */}
      {hasCategories ? (
        <label>
          Category<br />
          <select
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: e.target.value })}
            style={{ width: '100%' }}
          >
            <option value="">(none)</option>
            {cats.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      ) : (
        <label>
          Category (type a name)<br />
          <input
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="e.g., Salads"
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            No categories found — we’ll save this as a text category.
          </div>
        </label>
      )}

      <br /><br />

      <label>
        Image<br />
        <input
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={upload}
          disabled={!file || uploading}
          style={{ marginLeft: 8 }}
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </label>

      {form.image_url && (
        <div style={{ marginTop: 10 }}>
          <img
            src={previewSrc}
            alt="preview"
            style={{ width: 220, height: 160, objectFit: 'cover', borderRadius: 8, background: '#f6f6f6' }}
            onError={(e) => { e.currentTarget.style.opacity = 0.4; }}
          />
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
            Stored URL: {form.image_url}
          </div>
        </div>
      )}

      <br />
      <button onClick={save} disabled={!canSave}>
        {saving ? 'Saving…' : 'Save item'}
      </button>
    </div>
  );
}