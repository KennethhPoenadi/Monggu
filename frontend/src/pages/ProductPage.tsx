import React, { useState, useEffect, useCallback } from "react";
import { type Product } from "../types/product";
import FoodClassifier from "../components/FoodClassifier";
import AIChatbot from "../components/AIChatbot";

interface ProductPageProps {
  user_id: number;
}

const ProductPage: React.FC<ProductPageProps> = ({ user_id }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "expiring" | "fresh">("all");
  const [showAIClassifier, setShowAIClassifier] = useState(false);

  const [showRecipeChat, setShowRecipeChat] = useState(false);
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    product_name: "",
    type_product: "",
    expiry_date: "",
    count: 1,
  });

  // ===== Glow helpers (no global CSS needed)
  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
  };
  const handleGlowLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.removeProperty("--x");
    e.currentTarget.style.removeProperty("--y");
  };
  // =====

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/products/user/${user_id}`);
      const data = await res.json();
      if (data.status === "success") setProducts(data.products);
    } catch (e) {
      console.error("Error loading products:", e);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Create product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_id }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server error:", errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const data = await res.json();
      if (data.status === "success") {
        setShowCreateForm(false);
        setFormData({ product_name: "", type_product: "", expiry_date: "", count: 1 });
        loadProducts();
      } else {
        alert("Error creating product: " + (data.message || data.detail || "unknown"));
      }
    } catch (e) {
      console.error("Error creating product:", e);
      alert("Error creating product: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (productId: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`http://localhost:8000/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") loadProducts();
    } catch (e) {
      console.error("Error deleting product:", e);
    }
  };

  // Helpers
  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Dark-theme badge colors
  const getProductStatus = (expiryDate: string) => {
    const daysLeft = getDaysUntilExpiry(expiryDate);
    if (daysLeft < 0)
      return { status: "Expired", color: "bg-red-500/15 text-red-300", icon: "❌" };
    if (daysLeft <= 3)
      return { status: "Expiring Soon", color: "bg-orange-500/15 text-orange-300", icon: "⚠️" };
    if (daysLeft <= 7)
      return { status: "Expiring", color: "bg-yellow-500/15 text-yellow-300", icon: "⏰" };
    return { status: "Fresh", color: "bg-emerald-500/15 text-emerald-300", icon: "✅" };
  };

  const handleAskForRecipe = (product: Product) => {
    setSelectedProductForRecipe(product);
    setShowRecipeChat(true);
  };

  const filteredProducts = products.filter((p) => {
    const daysLeft = getDaysUntilExpiry(p.expiry_date);
    if (filter === "expiring") return daysLeft <= 7 && daysLeft >= 0;
    if (filter === "fresh") return daysLeft > 7;
    return true;
  });

  const categories = [
    "Vegetables",
    "Fruits",
    "Dairy",
    "Meat",
    "Grains",
    "Snacks",
    "Beverages",
    "Other",
  ];

  const mapFoodTypeToCategory = (foodType: string): string => {
    const s = foodType.toLowerCase();
    if (/(pisang|apel|jeruk|buah|fruit|banana|apple|orange)/.test(s)) return "Fruits";
    if (/(sayur|brokoli|wortel|tomat|vegetable|broccoli|carrot|tomato)/.test(s)) return "Vegetables";
    if (/(nasi|mie|roti|pasta|rice|bread|noodle|grain)/.test(s)) return "Grains";
    if (/(ayam|ikan|daging|meat|chicken|fish|beef|seafood)/.test(s)) return "Meat";
    if (/(telur|keju|susu|dairy|cheese|milk|yogurt)/.test(s)) return "Dairy";
    if (/(snack|kue|biskuit|cake|cookie|dessert)/.test(s)) return "Snacks";
    if (/(minuman|kopi|teh|drink|coffee|tea|juice)/.test(s)) return "Beverages";
    return "Other";
  };

  const handleFoodDetected = (foodType: string) => {
    const category = mapFoodTypeToCategory(foodType);
    setFormData((prev) => ({ ...prev, product_name: foodType, type_product: category }));
    setShowAIClassifier(false);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* blob dekorasi */}
      <svg
        className="pointer-events-none absolute -right-24 -top-24 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-emerald-500/30"
        />
      </svg>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER (frosted) */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              📦 Product Management
            </h1>
            <p className="mt-2 text-slate-300">Track and manage your food inventory</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-sky-600/20"
            >
              ➕ Add New Product
            </button>
          </div>

          {/* Expiry Warning Banner - dark style */}
          {(() => {
            const expiring = products.filter((p) => {
              const d = getDaysUntilExpiry(p.expiry_date);
              return d <= 7 && d >= 0;
            });
            if (!expiring.length) return null;
            return (
              <div className="mt-6 rounded-xl border border-orange-400/30 bg-orange-500/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-orange-200 font-semibold">
                      {expiring.length} item{expiring.length > 1 ? "s" : ""} expiring soon!
                    </h3>
                    <p className="text-sm text-orange-300">
                      Get recipe suggestions to use these ingredients before they expire.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {expiring.slice(0, 3).map((p) => (
                        <span
                          key={p.product_id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-400/20 text-orange-200"
                        >
                          {p.product_name}
                        </span>
                      ))}
                      {expiring.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-400/20 text-orange-200">
                          +{expiring.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filter buttons */}
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filter === "all"
                  ? "bg-sky-600 text-white shadow"
                  : "border border-slate-700 bg-slate-900/60 hover:bg-slate-900"
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilter("fresh")}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filter === "fresh"
                  ? "bg-emerald-600 text-white shadow"
                  : "border border-slate-700 bg-slate-900/60 hover:bg-slate-900"
              }`}
            >
              Fresh
            </button>
            <button
              onClick={() => setFilter("expiring")}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                filter === "expiring"
                  ? "bg-orange-600 text-white shadow"
                  : "border border-slate-700 bg-slate-900/60 hover:bg-slate-900"
              }`}
            >
              Expiring
            </button>
          </div>
        </section>

        {/* CREATE MODAL (dark frosted) */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
                  Add New Product
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded p-1 text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-200">
                    Product Name <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                      placeholder="e.g., Fresh Tomatoes"
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAIClassifier(!showAIClassifier)}
                      className="whitespace-nowrap rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700"
                    >
                      🤖 AI Detect
                    </button>
                  </div>

                  {showAIClassifier && (
                    <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-violet-200">📸 AI Food Detection</h4>
                        <p className="text-xs text-slate-300">
                          Upload a photo to auto-detect product name & category
                        </p>
                      </div>
                      <FoodClassifier
                        onFoodDetected={handleFoodDetected}
                        className="rounded-xl border border-violet-500/30"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-200">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    value={formData.type_product}
                    onChange={(e) => setFormData({ ...formData, type_product: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-200">
                    Quantity <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    value={formData.count}
                    onChange={(e) =>
                      setFormData({ ...formData, count: parseInt(e.target.value) || 1 })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-200">
                    Expiry Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-sky-600 py-3 font-semibold text-white transition-all hover:bg-sky-700 disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Add Product"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 py-3 font-semibold text-slate-200 hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-sky-500" />
            <p className="mt-4 text-slate-300">Loading products...</p>
          </div>
        )}

        {/* GRID */}
        {!loading && (
          <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => {
              const days = getDaysUntilExpiry(p.expiry_date);
              const status = getProductStatus(p.expiry_date);
              return (
                <div
                  key={p.product_id}
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
                >
                  {/* cursor-follow glow */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-px -z-10 opacity-0 blur group-hover:opacity-100 group-hover:blur-md"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.15), transparent 40%)",
                    }}
                  />

                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500">
                        <span className="text-xl text-white">📦</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">{p.product_name}</h3>
                        <p className="text-sm text-slate-400">{p.type_product}</p>
                      </div>
                    </div>
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}
                    >
                      <span>{status.icon}</span>
                      {status.status}
                    </span>
                  </div>

                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantity:</span>
                      <span className="font-medium text-slate-100">{p.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expiry Date:</span>
                      <span className="font-medium text-slate-100">
                        {new Date(p.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Days Left:</span>
                      <span
                        className={`font-medium ${
                          days <= 3 ? "text-red-300" : days <= 7 ? "text-orange-300" : "text-emerald-300"
                        }`}
                      >
                        {days > 0 ? `${days} days` : "Expired"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Added:</span>
                      <span className="font-medium text-slate-100">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {days <= 7 && days > 0 && (
                      <button
                        onClick={() => handleAskForRecipe(p)}
                        className="flex-1 rounded-xl bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/30"
                      >
                        🤖 Ask for Recipe
                      </button>
                    )}
                    <button
                      onClick={() => deleteProduct(p.product_id)}
                      className="flex-1 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full rounded-2xl border border-slate-700/60 bg-slate-900/60 p-12 text-center text-slate-300">
                <div className="mb-4 text-7xl">📦</div>
                <h3 className="mb-2 text-2xl font-bold text-slate-100">
                  {filter === "all" ? "No products yet" : `No ${filter} products`}
                </h3>
                <p className="text-slate-400">
                  {filter === "all"
                    ? "Add your first product to get started!"
                    : `No products found in the ${filter} category.`}
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* AI Recipe Chatbot Modal */}
      {selectedProductForRecipe && (
        <div className="text-slate-800">
          <AIChatbot
            isOpen={showRecipeChat}
            onClose={() => {
              setShowRecipeChat(false);
              setSelectedProductForRecipe(null);
            }}
            initialIngredients={[selectedProductForRecipe.product_name]}
            context="expired"
          />
        </div>
      )}
    </div>
  );
};

export default ProductPage;
