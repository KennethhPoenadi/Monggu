import React, { useState, useEffect, useCallback } from "react";
import { type Product } from "../types/product";

interface ProductPageProps {
  user_id: number;
}

const ProductPage: React.FC<ProductPageProps> = ({ user_id }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "expiring" | "fresh">("all");

  // Form state
  const [formData, setFormData] = useState({
    product_name: "",
    type_product: "",
    expiry_date: "",
    count: 1,
  });

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/products/user/${user_id}`
      );
      const data = await response.json();
      if (data.status === "success") {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error loading products:", error);
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
      const response = await fetch("http://localhost:8000/products/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          user_id,
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        alert("Product created successfully!");
        setShowCreateForm(false);
        setFormData({
          product_name: "",
          type_product: "",
          expiry_date: "",
          count: 1,
        });
        loadProducts();
      } else {
        alert("Error creating product: " + data.message);
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error creating product");
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const deleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(
        `http://localhost:8000/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (data.status === "success") {
        alert("Product deleted successfully!");
        loadProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // Get days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status based on expiry
  const getProductStatus = (expiryDate: string) => {
    const daysLeft = getDaysUntilExpiry(expiryDate);
    if (daysLeft < 0)
      return {
        status: "Expired",
        color: "bg-red-100 text-red-800",
        icon: "❌",
      };
    if (daysLeft <= 3)
      return {
        status: "Expiring Soon",
        color: "bg-orange-100 text-orange-800",
        icon: "⚠️",
      };
    if (daysLeft <= 7)
      return {
        status: "Expiring",
        color: "bg-yellow-100 text-yellow-800",
        icon: "⏰",
      };
    return {
      status: "Fresh",
      color: "bg-green-100 text-green-800",
      icon: "✅",
    };
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const daysLeft = getDaysUntilExpiry(product.expiry_date);
    if (filter === "expiring") {
      return daysLeft <= 7 && daysLeft >= 0;
    } else if (filter === "fresh") {
      return daysLeft > 7;
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              📦 Product Management
            </h1>
            <p className="text-gray-600 text-lg">
              Track and manage your food inventory
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                <span>➕</span>
                Add New Product
              </span>
            </button>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  filter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setFilter("fresh")}
                className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  filter === "fresh"
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                Fresh
              </button>
              <button
                onClick={() => setFilter("expiring")}
                className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                  filter === "expiring"
                    ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                Expiring
              </button>
            </div>
          </div>
        </div>

        {/* Create Product Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Add New Product
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Fresh Tomatoes"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    value={formData.type_product}
                    onChange={(e) =>
                      setFormData({ ...formData, type_product: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    value={formData.count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        count: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Expiry Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    value={formData.expiry_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:hover:scale-100"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>📦</span>
                        Add Product
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-2xl transition-all duration-300 border border-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">
              Loading products...
            </p>
          </div>
        )}

        {/* Products Grid */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const daysUntilExpiry = getDaysUntilExpiry(product.expiry_date);
              const statusInfo = getProductStatus(product.expiry_date);
              return (
                <div
                  key={product.product_id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                        <span className="text-xl text-white">📦</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          {product.product_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {product.type_product}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.color}`}
                    >
                      <span>{statusInfo.icon}</span>
                      {statusInfo.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-medium">{product.count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Expiry Date:</span>
                      <span className="font-medium">
                        {new Date(product.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Days Left:</span>
                      <span
                        className={`font-medium ${
                          daysUntilExpiry <= 3
                            ? "text-red-600"
                            : daysUntilExpiry <= 7
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        {daysUntilExpiry > 0
                          ? `${daysUntilExpiry} days`
                          : "Expired"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Added:</span>
                      <span className="font-medium">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteProduct(product.product_id)}
                      className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl shadow-lg">
                <div className="text-8xl mb-6">📦</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3">
                  {filter === "all"
                    ? "No products yet"
                    : `No ${filter} products`}
                </h3>
                <p className="text-gray-500 text-lg">
                  {filter === "all"
                    ? "Add your first product to get started!"
                    : `No products found in the ${filter} category.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
