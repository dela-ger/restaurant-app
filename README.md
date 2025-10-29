# QR Restaurant Ordering — One-Pager

## 1) What we built

* QR → `/menu?t=<token>` resolves to a **table**.
* Customer sees **menu**, adds to **cart**, places **order**, can **call waiter**.
* Admin can **upload dish images** and **create items** (with categories or free-text).

---

## 2) Backend (Express + SQLite)

### Architecture

* **Single SQLite connection**: `server/db/conn.js` (absolute path + `PRAGMA foreign_keys=ON`).
* **Static media**: `app.use('/uploads', express.static(...))`.
* **Routers** mounted: `/api/media`, `/api/menu`, `/api/order`, `/api/table`.

### Endpoints (core)

* **Media**: `POST /api/media/upload` → `{ url: "/uploads/xxxx.jpg" }`
* **Menu**

  * `GET /api/menu` — *schema-aware SELECT (handles missing `image_url` / `categories`)*
  * `POST /api/menu` — *schema-aware INSERT* (`name`, `price`, optional `image_url`, `category_id` **or** `category`)
  * `PATCH /api/menu/:id` — *schema-aware UPDATE* (only updates columns that exist)
  * `GET /api/menu/categories` — returns list or `[]` if table missing
* **Tables**

  * `GET /api/table/resolve/:token` → `{ table_id, table_number }`
  * `GET /api/table/stations` → list of tables + QR URLs

### Why “schema-aware” matters

We use `PRAGMA table_info` and `sqlite_master` to detect columns/tables and **build SQL conditionally**. This prevents “no such column/table” 500s during incremental migrations.

---

## 3) File upload flow

1. Admin selects file → **POST** `/api/media/upload` (multer) → `{ url: "/uploads/..." }`
2. Admin **saves item** via **POST** `/api/menu` including `image_url`.
3. Client displays image by **prefixing** `/uploads/...` with API base (port 5000 in dev).

**Tip:** You can also make the upload route return an **absolute** URL with `BASE_URL`.

---

## 4) Frontend (React)

### Pages/Components

* **MenuPage** (`/menu?t=<token>`):

  * Step 1: resolve **token** → if fail, redirect `/?error=invalid_token`
  * Step 2: fetch **menu** → if fail, show inline error (don’t redirect)
  * Category **chips** (`All` + unique categories) → filter grid
* **MenuItemCard**:

  * Build image `src`:

    ```js
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const src = item.image_url?.startsWith('http') ? item.image_url : `${API_BASE}${item.image_url}`;
    ```
* **AdminNewItem**:

  * Upload → set `form.image_url` → Save → POST `/api/menu`
  * If `/categories` empty → show **free-text** `category`; else dropdown for `category_id`
  * Disable **Save** until `name`, `price`, `image_url` are set

### Hooks (what, why)

* `useState` — local state (form, lists, loading flags).
* `useEffect` — side effects (fetch categories; resolve token → fetch menu).
* `useMemo` — derived values (unique categories; preview URL) to avoid recompute.
* `useSearchParams` — read `t` token from query.
* `useNavigate` — redirect on invalid/missing token.
* Context (`CartProvider`, `useCart`) — shared cart state (avoids prop drilling).

---

## 5) Key techniques (interview soundbites)

* **Schema-aware SQL**: “We inspect schema at runtime and conditionally build SELECT/INSERT/UPDATE. That lets us deploy migrations safely without breaking endpoints.”
* **Single DB connection + absolute path**: “Prevents accidental new DB files and keeps PRAGMA consistent.”
* **Decoupled error handling**: “Token resolution errors redirect; menu errors stay inline. Better UX + debugging.”
* **Static media + relative URLs**: “Store `/uploads/...` in DB; prefix with env-based API base. Environment agnostic and CDN-friendly.”
* **Admin category fallback**: “Supports `category_id` when normalized, or free-text `category` pre-normalization—keeps the UI unblocked.”

---

## 6) Minimal sequence (text diagram)

**Scan QR → Menu Page**

```
Browser: GET /menu?t=TOKEN
App:     GET /api/table/resolve/TOKEN  → 200 { table_id }
App:     GET /api/menu                 → 200 [items...]
User:    Add to cart → POST /api/order
```

**Admin create item**

```
Admin:   POST /api/media/upload (image)      → { url: "/uploads/..." }
Admin:   POST /api/menu { name, price, image_url, category_id? | category? } → 200 created
App:     GET /api/menu → item includes image_url
```

---

## 7) Testing checklist

* `GET /health` → `{ ok: true }`
* Upload works & file opens at `http://localhost:5000/uploads/...`
* AdminNewItem:

  * Preview shows (uses `VITE_API_URL`)
  * Save disabled until `name`,`price`,`image_url`
  * After save, `GET /api/menu` shows item with `image_url`
* Customer menu shows images (Network → images load from **5000**, not 3000)

---

## 8) Env & deploy

* **Dev**: `VITE_API_URL=http://localhost:5000`
