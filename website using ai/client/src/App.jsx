import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import api from "./api";

/* --------------------- helpers --------------------- */
function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

function sortItems(items, sort) {
  const arr = [...items];
  if (sort === "price-asc") arr.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") arr.sort((a, b) => b.price - a.price);
  if (sort === "newest") arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return arr;
}

/* --------------------- tiny cart count bus --------------------- */
function emitCartCount(n) {
  window.dispatchEvent(new CustomEvent("cart:count", { detail: n }));
}
async function fetchCartCount() {
  try {
    const { data } = await api.get("/api/cart");
    const count = (data?.items || []).reduce((s, it) => s + (it.qty || 0), 0);
    return count;
  } catch {
    return 0;
  }
}

/* --------------------- navbar with category + search + sort + cart badge --------------------- */
function Navbar() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState("");      // categoryId
  const [sort, setSort] = useState("newest");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    api.get("/api/catalog/categories").then((r) => setCats(r.data)).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    // initial cart count
    (async () => setCartCount(await fetchCartCount()))();
    // live updates
    const onCount = (e) => setCartCount(e.detail);
    window.addEventListener("cart:count", onCount);
    return () => window.removeEventListener("cart:count", onCount);
  }, []);

  const go = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    if (sort) params.set("sort", sort);
    nav(`/search?${params.toString()}`);
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom sticky-top gradient-navbar">
      <div className="container">
        <Link className="navbar-brand fw-semibold text-white" to="/">🛍️ Shop</Link>

        <form className="d-flex ms-auto me-3 gap-2" onSubmit={go} role="search" style={{ maxWidth: 820, width: "100%" }}>
          <select className="form-select" style={{ maxWidth: 200 }} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <input
            className="form-control"
            type="search"
            placeholder="Search products…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select className="form-select" style={{ maxWidth: 180 }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
          </select>

          <button className="btn btn-light" type="submit">Search</button>
        </form>

        <div className="d-flex gap-2">
          <Link className="btn btn-outline-light position-relative" to="/cart">
            🛒 Cart
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark">
                {cartCount}
              </span>
            )}
          </Link>
          <Link className="btn btn-outline-light" to="/auth">Login</Link>
        </div>
      </div>
    </nav>
  );
}

/* --------------------- product card --------------------- */
function ProductCard({ p }) {
  const img = (p.images && p.images[0]) || "https://picsum.photos/seed/placeholder/800/600";
  return (
    <div className="card shadow-card h-100 colorful-card">
      <img src={img} className="card-img-top object-fit-cover" style={{ aspectRatio: "4/3" }} alt={p.title} />
      <div className="card-body d-flex flex-column">
        <h6 className="card-title">{p.title}</h6>
        <p className="card-text text-body-secondary small">{p.description}</p>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <div className="fw-semibold">₹{p.price}</div>
          <div className="d-flex gap-2">
            <Link className="btn btn-sm btn-outline-secondary" to={`/p/${p.slug}`}>View</Link>
            <AddToCart productId={p._id} small />
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------- add-to-cart button (emits cart count) --------------------- */
function AddToCart({ productId, small }) {
  const add = async () => {
    try {
      const { data } = await api.post("/api/cart/add", { productId, qty: 1 });
      const count = (data?.items || []).reduce((s, it) => s + (it.qty || 0), 0);
      emitCartCount(count);
      alert("Added to cart");
    } catch (e) {
      if (e?.response?.status === 401) alert("Please login first (Auth page)");
      else alert("Failed to add");
    }
  };
  return <button className={`btn ${small ? "btn-sm" : ""} btn-primary`} onClick={add}>Add</button>;
}

/* --------------------- pages --------------------- */
function Home() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/api/catalog/products").then((r) => setItems(r.data));
  }, []);
  return (
    <div className="container py-4">
      <h1 className="h4 mb-3 text-gradient">Featured</h1>
      <div className="row g-3">
        {items.map((p) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={p._id}>
            <ProductCard p={p} />
          </div>
        ))}
        {items.length === 0 && <div className="text-muted">No products.</div>}
      </div>
    </div>
  );
}

function ProductPage() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  useEffect(() => {
    api.get(`/api/catalog/products/${slug}`).then((r) => setP(r.data));
  }, [slug]);
  if (!p) return <div className="container py-4">Loading…</div>;

  const images = p.images?.length ? p.images : ["https://picsum.photos/seed/placeholder/800/600"];

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card shadow-card colorful-card">
            <img src={images[0]} className="card-img-top object-fit-cover" style={{ aspectRatio: "4/3" }} alt={p.title} />
            {images.length > 1 && (
              <div className="d-flex gap-2 p-3 flex-wrap">
                {images.slice(1).map((src, i) => (
                  <img key={i} src={src} alt="" className="rounded" style={{ width: 88, height: 66, objectFit: "cover" }} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-card colorful-card">
            <div className="card-body">
              <h2 className="h4">{p.title}</h2>
              <p className="mt-3">{p.description}</p>
              <div className="d-flex justify-content-between align-items-center">
                <div className="fs-4 fw-semibold">₹{p.price}</div>
                <AddToCart productId={p._id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchPage() {
  const query = useQuery();
  const q = query.get("q") || "";
  const category = query.get("category") || "";
  const sort = query.get("sort") || "newest";
  const [items, setItems] = useState([]);

  useEffect(() => {
    const params = {};
    if (q) params.q = q;
    if (category) params.category = category;
    api.get("/api/catalog/products", { params }).then((r) => {
      setItems(sortItems(r.data, sort));
    });
  }, [q, category, sort]);

  return (
    <div className="container py-4">
      <h3 className="h5 mb-3">
        Results {q && <>for “{q}”</>} {category && <span className="text-muted">(filtered)</span>}
      </h3>
      <div className="row g-3">
        {items.map((p) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={p._id}>
            <ProductCard p={p} />
          </div>
        ))}
        {items.length === 0 && <div className="text-muted">No results.</div>}
      </div>
    </div>
  );
}

function CartPage() {
  const [cart, setCart] = useState(null);
  const load = async () => {
    try {
      const { data } = await api.get("/api/cart");
      setCart(data);
      const count = (data?.items || []).reduce((s, it) => s + (it.qty || 0), 0);
      emitCartCount(count);
    } catch {
      setCart(null);
      emitCartCount(0);
    }
  };
  useEffect(() => { load(); }, []);
  const updateQty = async (pid, qty) => { await api.post("/api/cart/update", { productId: pid, qty }); load(); };

  if (!cart) return <div className="container py-4">Please login to view your cart.</div>;
  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-card colorful-card">
            <div className="card-body">
              <h2 className="h5 mb-3">Your Cart</h2>
              {cart.items.length === 0 && <div className="text-muted">Cart is empty.</div>}
              {cart.items.map((it) => (
                <div key={it.productId?._id || it.productId} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-light rounded" style={{ width: 48, height: 48 }} />
                    <div>
                      <div className="fw-medium">{it.productId?.title || it.productId}</div>
                      <div className="text-body-secondary small">₹{it.priceAtAdd}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQty(it.productId._id, Math.max(0, it.qty - 1))}>-</button>
                    <span className="px-2">{it.qty}</span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQty(it.productId._id, it.qty + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-card colorful-card">
            <div className="card-body">
              <div className="fs-5 fw-semibold">Total: ₹{cart.total}</div>
              <Link to="/checkout" className="btn btn-primary w-100 mt-3">Proceed to Checkout</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmail = (s = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).toLowerCase());

  const validateRegister = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!isEmail(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    if (name && name.trim().length < 2) e.name = "Name looks too short";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateLogin = () => {
    const e = {};
    if (!email) e.email = "Email is required";
    else if (!isEmail(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const register = async (e) => {
    e.preventDefault();
    setMsg(""); if (!validateRegister()) return;
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/register", { email, password, name });
      setMsg(data.message || "Registered. Now Login.");
    } catch (err) {
      const sv = err?.response?.data;
      setErrors(sv?.errors || {});
      setMsg(sv?.error || "Register failed");
    } finally { setLoading(false); }
  };

  const login = async (e) => {
    e.preventDefault();
    setMsg(""); if (!validateLogin()) return;
    try {
      setLoading(true);
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      setMsg("Logged in!");
      // after login, sync cart count
      const count = await fetchCartCount();
      emitCartCount(count);
    } catch (err) {
      const sv = err?.response?.data;
      setErrors(sv?.errors || {});
      setMsg(sv?.error || "Login failed");
    } finally { setLoading(false); }
  };

  const cls = (key) => `form-control ${errors[key] ? "is-invalid" : ""}`;

  return (
    <div className="container py-4">
      <div className="row g-4">
        <form onSubmit={register} className="col-md-6">
          <div className="card shadow-card colorful-card">
            <div className="card-body">
              <h2 className="h5 mb-3">Create account</h2>

              <input className={cls("name")} placeholder="Name (optional)" value={name}
                     onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: null }); }} />
              {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}

              <input className={cls("email")} placeholder="Email" value={email}
                     onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: null }); }} />
              {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}

              <input className={cls("password")} type="password" placeholder="Password" value={password}
                     onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: null }); }} />
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}

              <button className="btn btn-dark mt-2" disabled={loading}>Register</button>
              {msg && <div className="small text-body-secondary mt-2">{msg}</div>}
            </div>
          </div>
        </form>

        <form onSubmit={login} className="col-md-6">
          <div className="card shadow-card colorful-card">
            <div className="card-body">
              <h2 className="h5 mb-3">Login</h2>

              <input className={cls("email")} placeholder="Email" value={email}
                     onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: null }); }} />
              {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}

              <input className={cls("password")} type="password" placeholder="Password" value={password}
                     onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: null }); }} />
              {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}

              <button className="btn btn-primary mt-2" disabled={loading}>Login</button>
              {msg && <div className="small text-body-secondary mt-2">{msg}</div>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const [address, setAddress] = useState({ line1: "", city: "", pin: "" });
  const place = async () => {
    try {
      const { data } = await api.post("/api/orders/create", { address });
      alert("Order placed (COD). Order ID: " + data._id);
      const count = await fetchCartCount();
      emitCartCount(count);
    } catch (e) { alert(e?.response?.data?.error || "Failed"); }
  };
  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <div className="card shadow-card colorful-card">
        <div className="card-body">
          <h2 className="h5 mb-3">Checkout (Cash on Delivery)</h2>
          <input className="form-control mb-2" placeholder="Address line"
                 value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
          <input className="form-control mb-2" placeholder="City"
                 value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <input className="form-control mb-3" placeholder="PIN"
                 value={address.pin} onChange={(e) => setAddress({ ...address, pin: e.target.value })} />
          <button className="btn btn-success" onClick={place}>Place Order</button>
        </div>
      </div>
    </div>
  );
}

/* --------------------- app --------------------- */
export default function App() {
  return (
    <div className="app-bg">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/:slug" element={<ProductPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
      <footer className="border-top mt-5">
        <div className="container py-4 text-muted small">© {new Date().getFullYear()} Shop — demo app</div>
      </footer>
    </div>
  );
}
