import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Product Listing Manager Dashboard
// Modern, minimal dashboard for product upload/management/sync

const BRAND_COLORS = {
  primary: "#1D3557",
  secondary: "#A8DADC",
  accent: "#E63946",
  dark: "#1a1a1a",
  navbarTxt: "#fff"
};

const API_BASE = "http://localhost:3001"; // Change to deployment base path if needed

// Utility functions
const fetchJSON = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  return res.ok ? res.json() : Promise.reject(await res.text());
};
const fetchChannels = () => fetchJSON(`${API_BASE}/channels/available`);
const fetchCountries = () => fetchJSON(`${API_BASE}/countries/available`);
const fetchProducts = () => fetchJSON(`${API_BASE}/products/`);
const fetchProductStatus = id => fetchJSON(`${API_BASE}/status/listing/${id}`);
const fetchProduct = id => fetchJSON(`${API_BASE}/products/${id}`);
const uploadExcelFile = file => {
  const data = new FormData();
  data.append("file", file);
  return fetchJSON(`${API_BASE}/upload/excel`, { method: "POST", body: data });
};
const uploadProductImage = file => {
  const data = new FormData();
  data.append("file", file);
  return fetchJSON(`${API_BASE}/upload/image`, { method: "POST", body: data });
};
const analyzeImage = file => {
  const data = new FormData();
  data.append("file", file);
  return fetchJSON(`${API_BASE}/analysis/image`, { method: "POST", body: data });
};
const createProduct = prod =>
  fetchJSON(`${API_BASE}/products/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prod)
  });
const updateProduct = (id, prod) =>
  fetchJSON(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prod)
  });
const resyncProduct = id =>
  fetchJSON(`${API_BASE}/products/${id}/resync`, { method: "POST" });
const selectChannels = ({ product_id, channels, countries }) =>
  fetchJSON(`${API_BASE}/select_channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id, channels, countries })
  });

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Sidebar({ channels, selected, setSelected }) {
  return (
    <nav
      style={{
        background: BRAND_COLORS.primary,
        color: "#fff",
        width: 210,
        minHeight: "100vh",
        padding: 0,
        fontWeight: "500",
        borderRight: "1.5px solid #ececec",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          fontSize: 20,
          letterSpacing: 1,
          padding: "32px 0 28px 0",
          textAlign: "center",
          borderBottom: "1px solid #346287",
          color: BRAND_COLORS.accent,
          background: "rgba(0,0,0,.08)"
        }}
      >
        <span role="img" aria-label="logo" style={{ marginRight: 7 }}>
          📦
        </span>
        ProductHub
      </div>
      {channels.map(ch => (
        <div
          key={ch}
          style={{
            cursor: "pointer",
            padding: "16px 0px 16px 32px",
            background:
              selected === ch
                ? "linear-gradient(90deg, #A8DADC26 50%,transparent )"
                : "transparent",
            color: selected === ch ? BRAND_COLORS.accent : "#fff",
            fontSize: 16,
            borderLeft: selected === ch ? `6px solid ${BRAND_COLORS.accent}` : "none",
            transition: "all 0.18s"
          }}
          onClick={() => setSelected(ch)}
        >
          {ch}
        </div>
      ))}
    </nav>
  );
}

function Navbar({ onUploadExcel, onThemeToggle, theme, userName }) {
  return (
    <header
      style={{
        background: BRAND_COLORS.primary,
        color: BRAND_COLORS.navbarTxt,
        height: 58,
        display: "flex",
        alignItems: "center",
        padding: "0 34px 0 0",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 8
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 36, paddingLeft: 10 }}>
        <b style={{ fontWeight: 700, fontSize: 20, letterSpacing: 1, color: BRAND_COLORS.accent }}>
          🗂 Multi-Channel Listing Dashboard
        </b>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <ExcelUploadButton onUpload={onUploadExcel} />
        <button className="theme-toggle" onClick={onThemeToggle}>
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
        <span style={{ opacity: 0.7 }}>👤 {userName}</span>
      </div>
    </header>
  );
}

function ExcelUploadButton({ onUpload }) {
  const inputRef = useRef();
  return (
    <div>
      <button
        style={{
          background: BRAND_COLORS.secondary,
          color: BRAND_COLORS.primary,
          border: "none",
          borderRadius: 6,
          fontWeight: "bold",
          letterSpacing: ".5px",
          padding: "9px 18px",
          cursor: "pointer"
        }}
        onClick={() => inputRef.current.click()}
      >
        ⬆️ Import Excel
      </button>
      <input
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        accept=".xls,.xlsx,.csv"
        onChange={e => e.target.files[0] && onUpload(e.target.files[0])}
      />
    </div>
  );
}

function ProductImageUpload({ onImageSelected, previewUrl }) {
  const inputRef = useRef();
  return (
    <div style={{ margin: "6px 0" }}>
      <button
        style={{
          background: BRAND_COLORS.accent,
          color: "#fff",
          border: "none",
          padding: "4px 17px",
          fontWeight: 600,
          borderRadius: 6,
          marginBottom: 7,
          cursor: "pointer"
        }}
        onClick={e => inputRef.current.click()}
        type="button"
      >
        📷 Upload Image
      </button>
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        onChange={e => e.target.files[0] && onImageSelected(e.target.files[0])}
        style={{ display: "none" }}
      />
      {previewUrl && (
        <img
          alt="product"
          src={previewUrl}
          style={{
            maxHeight: 68,
            marginRight: 8,
            borderRadius: 6,
            marginTop: 4,
            border: "1px solid #d6d6d6"
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  initial,
  onSubmit,
  imagePreviewUrl,
  onImageUpload,
  channels,
  countries,
  prefillStatus
}) {
  // States for the form (multi-product)
  const [products, setProducts] = useState(initial || [
    { name: "", description: "", price: "", stock: "", sku: "" }
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [mainImageUrl, setMainImageUrl] = useState(imagePreviewUrl || "");
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileError, setFileError] = useState("");
  const [imageAnalysis, setImageAnalysis] = useState(null);

  // Handle Excel prefill
  useEffect(() => {
    if (initial && initial.length) {
      setProducts(initial);
    }
    // eslint-disable-next-line
  }, [initial]);

  // Handle image upload + analysis
  const handleImageSelected = async file => {
    setAnalyzing(true);
    setImageFile(file);
    // Do backend upload to preview
    try {
      const upRes = await uploadProductImage(file);
      if (upRes && upRes.file_name) {
        setMainImageUrl(`${API_BASE}/preview/image/${upRes.file_name}`);
      }
      // Analyze image
      const analysis = await analyzeImage(file);
      setImageAnalysis(analysis);
      // Pre-fill (simulate: merge into all forms for demo)
      if (analysis.product_name) {
        setProducts(pp =>
          pp.map((p, i) =>
            i === 0 // Only prefill first
              ? {
                  ...p,
                  name: analysis.product_name,
                  ...(analysis.attributes || {})
                }
              : p
          )
        );
      }
      setFileError("");
      if (onImageUpload) onImageUpload(upRes?.file_name);
    } catch (e) {
      setFileError("Failed to analyze image or upload.");
    }
    setAnalyzing(false);
  };

  // Add a product row
  const addProduct = () =>
    setProducts(p => [
      ...p,
      { name: "", description: "", price: "", stock: "", sku: "" }
    ]);

  // Remove a product row
  const removeProduct = idx =>
    setProducts(p => p.filter((_, i) => i !== idx));

  // Handle input
  const handleInput = (idx, k, v) => {
    setProducts(products =>
      products.map((p, i) => (i === idx ? { ...p, [k]: v } : p))
    );
  };

  // Handle channel & country
  const toggleChannel = ch => {
    setSelectedChannels(chs =>
      chs.includes(ch) ? chs.filter(c => c !== ch) : [...chs, ch]
    );
  };
  const toggleCountry = c => {
    setSelectedCountries(cs =>
      cs.includes(c) ? cs.filter(cc => cc !== c) : [...cs, c]
    );
  };

  // Submit the form
  const handleSubmit = async e => {
    e.preventDefault();
    if (!products.length) return;
    const prodList = products.map(p => ({
      ...p,
      price: Number(p.price),
      stock: Number(p.stock),
      main_image_url: mainImageUrl
    }));
    await onSubmit(prodList, selectedChannels, selectedCountries);
  };

  return (
    <form
      style={{
        background: "#fff",
        padding: "22px 32px 17px 32px",
        borderRadius: 14,
        boxShadow: "0 3px 16px rgba(24,32,56,0.04)",
        marginBottom: 34,
        marginTop: 18,
        maxWidth: 690
      }}
      onSubmit={handleSubmit}
    >
      <h3 style={{ margin: 0, marginBottom: 5, color: BRAND_COLORS.primary }}>
        Create Product Listing
      </h3>
      <ProductImageUpload onImageSelected={handleImageSelected} previewUrl={mainImageUrl} />
      {fileError && (
        <div style={{ color: BRAND_COLORS.accent, marginBottom: 5, fontWeight: 500 }}>{fileError}</div>
      )}

      {imageAnalysis && (
        <div
          style={{
            marginBottom: 7,
            background: BRAND_COLORS.secondary,
            color: BRAND_COLORS.primary,
            borderRadius: 7,
            padding: "6px 18px",
            fontSize: 14
          }}
        >
          <b>Auto-pre-fill:</b> Got <code>{imageAnalysis.product_name}</code>
        </div>
      )}
      {products.map((prod, idx) => (
        <div
          key={idx}
          style={{
            borderBottom: idx === products.length - 1 ? "none" : "1px solid #ececec",
            paddingBottom: 12,
            marginBottom: 12,
            display: "flex",
            gap: 22,
            flexWrap: "wrap"
          }}
        >
          <input
            required
            type="text"
            value={prod.name}
            placeholder="Name"
            onChange={e => handleInput(idx, "name", e.target.value)}
            style={{ width: 130 }}
          />
          <input
            type="text"
            value={prod.description}
            placeholder="Description"
            onChange={e => handleInput(idx, "description", e.target.value)}
            style={{ width: 180 }}
          />
          <input
            type="number"
            value={prod.price}
            placeholder="Price"
            onChange={e => handleInput(idx, "price", e.target.value)}
            style={{ width: 80 }}
            min={0}
            step={0.01}
            required
          />
          <input
            type="number"
            value={prod.stock}
            placeholder="Stock"
            onChange={e => handleInput(idx, "stock", e.target.value)}
            style={{ width: 70 }}
            min={0}
            required
          />
          <input
            type="text"
            value={prod.sku}
            placeholder="SKU"
            onChange={e => handleInput(idx, "sku", e.target.value)}
            style={{ width: 76 }}
          />
          {products.length > 1 && (
            <button
              type="button"
              style={{
                background: "transparent",
                color: BRAND_COLORS.accent,
                border: "none",
                padding: 0,
                fontWeight: "bolder",
                cursor: "pointer"
              }}
              onClick={() => removeProduct(idx)}
            >
              ❌
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        style={{ background: "#eee", color: "#1a1a1a", borderRadius: 5, marginRight: 12, border: "none", padding: "5px 10px" }}
        onClick={addProduct}
      >
        ➕ Add one
      </button>
      <div style={{ marginTop: 18 }}>
        <label style={{ fontWeight: "600", marginRight: 6 }}>
          Channels:&nbsp;
        </label>
        {channels.map(ch => (
          <label key={ch} style={{ marginRight: 8, fontWeight: 400 }}>
            <input
              type="checkbox"
              checked={selectedChannels.includes(ch)}
              onChange={() => toggleChannel(ch)}
              style={{ accentColor: BRAND_COLORS.accent }}
            />{" "}
            {ch}
          </label>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <label style={{ fontWeight: "600", marginRight: 6 }}>
          Countries:&nbsp;
        </label>
        {countries.map(cty => (
          <label key={cty} style={{ marginRight: 8, fontWeight: 400 }}>
            <input
              type="checkbox"
              checked={selectedCountries.includes(cty)}
              onChange={() => toggleCountry(cty)}
              style={{ accentColor: BRAND_COLORS.secondary }}
            />{" "}
            {cty}
          </label>
        ))}
      </div>
      <button
        type="submit"
        style={{
          background: BRAND_COLORS.primary,
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          marginTop: 24,
          padding: "10px 32px",
          letterSpacing: 0.4,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(78, 53, 87, 0.09)"
        }}
        disabled={analyzing}
        aria-busy={analyzing}
      >
        {analyzing ? "Analyzing..." : "List Product(s)"}
      </button>
    </form>
  );
}

// Modal dialog components
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(44,53,61,.36)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          minWidth: 320,
          maxWidth: "100vw",
          boxShadow: "0 10px 30px rgba(44,52,61,0.13)",
          padding: 18,
          position: "relative"
        }}
      >
        <button
          style={{
            position: "absolute",
            right: 17,
            top: 12,
            background: "transparent",
            border: "none",
            color: BRAND_COLORS.accent,
            fontWeight: 600,
            fontSize: 22,
            cursor: "pointer"
          }}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 18, color: BRAND_COLORS.primary }}>
          {title}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function ProductList({
  products,
  onEdit,
  onResync,
  statusById,
  onPreviewImg,
  refreshStatus
}) {
  return (
    <table
      style={{
        borderCollapse: "collapse",
        fontSize: 15,
        width: "100%",
        marginTop: 18,
        background: "#fff",
        borderRadius: 13,
        boxShadow: "0 2px 15px rgba(24,32,56,0.04)",
        overflow: "hidden"
      }}
    >
      <thead style={{ background: "#fcfcfc", color: BRAND_COLORS.primary }}>
        <tr>
          <th style={thStl}>ID</th>
          <th style={thStl}>Name</th>
          <th style={thStl}>Channels</th>
          <th style={thStl}>Countries</th>
          <th style={thStl}>Image</th>
          <th style={thStl}>Status</th>
          <th style={thStl}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map(prod => (
          <tr key={prod.id} style={{ background: "#fff" }}>
            <td style={tdStl}>{prod.id}</td>
            <td style={tdStl}>{prod.name || <i>-</i>}</td>
            <td style={tdStl}>{(prod.channels || []).join(", ")}</td>
            <td style={tdStl}>{(prod.countries || []).join(", ")}</td>
            <td style={tdStl}>
              {prod.main_image_url ? (
                <img
                  style={{ maxHeight: 40, borderRadius: 6, cursor: "pointer" }}
                  src={prod.main_image_url}
                  alt=""
                  onClick={() => onPreviewImg(prod.main_image_url)}
                />
              ) : (
                "-"
              )}
            </td>
            <td style={tdStl}>
              <StatusPill status={statusById && statusById[prod.id] ? statusById[prod.id].sync_status : "unknown"} />
              <RefreshStatusBtn pid={prod.id} onClick={() => refreshStatus(prod.id)} />
            </td>
            <td style={tdStl}>
              <button
                onClick={() => onEdit(prod)}
                style={iconBtn}
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => onResync(prod.id)}
                style={iconBtn}
                title="Resync"
              >
                🔄
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
const thStl = { padding: "8px 10px", background: "#fcfcfc", textAlign: "left" };
const tdStl = { padding: "12px 10px", borderTop: "1px solid #eee" };
const iconBtn = {
  fontWeight: 400,
  fontSize: 16,
  background: "none",
  border: "none",
  cursor: "pointer",
  marginRight: 8,
  color: BRAND_COLORS.accent
};

function StatusPill({ status }) {
  let color =
    status === "success"
      ? "#40B87B"
      : status === "in_progress"
      ? BRAND_COLORS.secondary
      : status === "failed"
      ? BRAND_COLORS.accent
      : "#888";

  let text = {
    success: "✅ Synced",
    in_progress: "⌛ Syncing",
    failed: "❌ Failed",
    unknown: "–"
  }[status] || status;
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        borderRadius: 8,
        padding: "3px 11px",
        fontWeight: 600,
        fontSize: 13,
        marginRight: 7
      }}
    >
      {text}
    </span>
  );
}
function RefreshStatusBtn({ pid, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#eee",
        border: "none",
        borderRadius: 5,
        fontSize: 11,
        color: "#666",
        marginLeft: 7,
        cursor: "pointer"
      }}
      title="Refresh"
    >
      🔄
    </button>
  );
}

// Main Dashboard Component
// PUBLIC_INTERFACE
export default function App() {
  // State for theme
  const [theme, setTheme] = useState("light");
  // Channel sidebar
  const [channels, setChannels] = useState(["All", "Lazada", "Shopee", "TikTok"]);
  const [selectedChannel, setSelectedChannel] = useState("All");
  // Countries
  const [countries, setCountries] = useState(["SG", "MY", "ID"]);
  // Products
  const [products, setProducts] = useState([]);
  const [statusById, setStatusById] = useState({});
  // For modals/dialogs
  const [productToEdit, setProductToEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState("");
  // Misc
  const [excelPrefilled, setExcelPrefilled] = useState(null);
  const [userName] = useState("admin@company.com"); // stub
  const [loadingExcel, setLoadingExcel] = useState(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial data
  useEffect(() => {
    // Load channels/countries from backend
    fetchChannels()
      .then(arr => { if(Array.isArray(arr)) setChannels(["All", ...arr]); })
      .catch(() => {});
    fetchCountries()
      .then(arr => { if(Array.isArray(arr)) setCountries(arr); })
      .catch(() => {});
  }, []);

  // Products fetch
  const reloadProducts = () =>
    fetchProducts()
      .then(list => setProducts(list))
      .catch(() => {});

  useEffect(() => {
    reloadProducts();
  }, []);

  // Poll product status for all products
  useEffect(() => {
    if (!products.length) return;
    let isAborted = false;
    async function pollAll() {
      let allStatus = {};
      for (const p of products) {
        try {
          const status = await fetchProductStatus(p.id);
          allStatus[p.id] = status;
        } catch {}
      }
      if (!isAborted) setStatusById(allStatus);
    }
    pollAll();
    const timer = setInterval(pollAll, 5000); // 5s poll
    return () => {
      isAborted = true;
      clearInterval(timer);
    };
  }, [products]);

  // Handlers
  const handleThemeToggle = () => setTheme(th => (th === "light" ? "dark" : "light"));

  // Handle Excel Upload
  const handleUploadExcel = async file => {
    setLoadingExcel(true);
    try {
      const res = await uploadExcelFile(file);
      if (Array.isArray(res.products)) {
        setExcelPrefilled(
          res.products.map(p => ({
            name: p.name || "",
            description: p.description || "",
            price: p.price || "",
            stock: p.stock || "",
            sku: p.sku || ""
          }))
        );
      }
      // Optionally show a dialog/toast
    } catch {
      alert("Excel import failed.");
    }
    setLoadingExcel(false);
  };

  // Handle product form submission (single/multi)
  const handleProductFormSubmit = async (prodList, channelsSelected, countriesSelected) => {
    for (const prod of prodList) {
      try {
        const newProd = await createProduct(prod); // POST
        if (channelsSelected.length || countriesSelected.length) {
          await selectChannels({
            product_id: newProd.id,
            channels: channelsSelected,
            countries: countriesSelected
          });
        }
      } catch (e) {
        alert("Create failed: " + e);
      }
    }
    setExcelPrefilled(null);
    reloadProducts();
  };

  // Modal: Edit
  const handleEdit = prod => {
    setProductToEdit(prod);
    setShowEditModal(true);
  };
  const handleEditSave = async updated => {
    try {
      await updateProduct(updated.id, updated);
      setShowEditModal(false);
    } catch (e) {
      alert("Update failed.");
    }
    reloadProducts();
  };

  // Modal: Image preview
  const handlePreviewImg = url => {
    setImageModalUrl(url);
    setShowImageModal(true);
  };

  // Modal: Resync
  const handleResync = async pid => {
    try {
      await resyncProduct(pid);
      alert("Triggered re-sync.");
    } catch {
      alert("Resync failed.");
    }
    reloadProducts();
  };

  const filterProducts = () => {
    return selectedChannel === "All"
      ? products
      : products.filter(p => p.channels && p.channels.includes(selectedChannel));
  };

  // Manual status refresh
  const handleManualRefreshStatus = async pid => {
    try {
      const status = await fetchProductStatus(pid);
      setStatusById(s => ({ ...s, [pid]: status }));
    } catch {}
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-secondary, #f5f7fb)" }}>
      {/* Sidebar */}
      <Sidebar channels={channels} selected={selectedChannel} setSelected={setSelectedChannel} />
      <div style={{ flexGrow: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar
          onUploadExcel={handleUploadExcel}
          onThemeToggle={handleThemeToggle}
          theme={theme}
          userName={userName}
        />
        <main
          style={{
            flexGrow: 1,
            background: "var(--bg-secondary, #f5f7fa)",
            padding: "30px 3vw"
          }}
        >
          {loadingExcel && (
            <div
              style={{
                background: "#fffbe5",
                padding: 15,
                borderRadius: 10,
                marginBottom: 15,
                fontWeight: 600,
                color: "#b9950c"
              }}
            >
              Processing Excel file, please wait...
            </div>
          )}
          <ProductForm
            initial={excelPrefilled}
            onSubmit={handleProductFormSubmit}
            channels={channels.filter(c => c !== "All")}
            countries={countries}
          />
          <div
            style={{
              margin: "25px 0 7px 0",
              color: "#232d37",
              fontWeight: 700,
              fontSize: 18
            }}
          >
            Product Listings
          </div>
          <ProductList
            products={filterProducts()}
            onEdit={handleEdit}
            onResync={handleResync}
            statusById={statusById}
            onPreviewImg={handlePreviewImg}
            refreshStatus={handleManualRefreshStatus}
          />
        </main>
      </div>
      {/* Edit Product Modal */}
      <Modal
        open={showEditModal}
        title="Edit Product"
        onClose={() => setShowEditModal(false)}
      >
        {productToEdit && (
          <EditProductForm
            prod={productToEdit}
            onSave={handleEditSave}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>
      {/* Image Preview Modal */}
      <Modal
        open={showImageModal}
        title="Image Preview"
        onClose={() => setShowImageModal(false)}
      >
        <img
          alt="Product"
          src={imageModalUrl}
          style={{ maxWidth: "100%", maxHeight: 330, borderRadius: 10, minWidth: 260 }}
        />
      </Modal>
    </div>
  );
}

// Edit form inside modal
function EditProductForm({ prod, onSave, onCancel }) {
  const [form, setForm] = useState({ ...prod });
  const handleInput = (k, v) => setForm({ ...form, [k]: v });
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave(form);
      }}
      style={{ minWidth: 310 }}
    >
      <div style={{ margin: "9px 0" }}>
        <b>Name: </b>
        <input
          value={form.name || ""}
          onChange={e => handleInput("name", e.target.value)}
          style={{ width: "70%" }}
        />
      </div>
      <div style={{ margin: "9px 0" }}>
        <b>Description: </b>
        <input
          value={form.description || ""}
          onChange={e => handleInput("description", e.target.value)}
          style={{ width: "70%" }}
        />
      </div>
      <div style={{ margin: "9px 0" }}>
        <b>Price: </b>
        <input
          type="number"
          value={form.price}
          min={0}
          onChange={e => handleInput("price", Number(e.target.value))}
          style={{ width: "50%" }}
        />{" "}
        <b>Stock: </b>
        <input
          type="number"
          value={form.stock}
          min={0}
          onChange={e => handleInput("stock", Number(e.target.value))}
          style={{ width: "50px" }}
        />
      </div>
      <div style={{ margin: "9px 0" }}>
        <b>SKU: </b>
        <input
          value={form.sku || ""}
          onChange={e => handleInput("sku", e.target.value)}
          style={{ width: "45%" }}
        />
      </div>
      <div style={{ textAlign: "right" }}>
        <button
          type="button"
          style={{
            marginRight: 15,
            background: "#fff",
            color: "#393",
            border: "1px solid #9c9",
            borderRadius: 4,
            padding: "6px 16px",
            cursor: "pointer"
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            background: BRAND_COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 18px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Save
        </button>
      </div>
    </form>
  );
}
