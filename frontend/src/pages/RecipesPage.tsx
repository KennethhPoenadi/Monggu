import React, { useState, useEffect, useCallback } from "react";

interface Recipe {
  recipe_id: number;
  user_id: number;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  category: string;
  prep_time: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  image_url?: string;
  created_at: string;
  updated_at?: string;
}

interface RecipesPageProps {
  user_id: number;
}

const categoryIcon = (c: string) => {
  switch (c) {
    case "Vegetables":
      return "🥬";
    case "Fruits":
      return "🍎";
    case "Grains":
      return "🌾";
    case "Dairy":
      return "🧀";
    case "Meat":
      return "🥩";
    case "Snacks":
      return "🍪";
    default:
      return "📝";
  }
};

const diffPill = (d: Recipe["difficulty"]) => {
  switch (d) {
    case "Easy":
      return "bg-emerald-500/15 text-emerald-300";
    case "Medium":
      return "bg-amber-500/15 text-amber-300";
    case "Hard":
      return "bg-rose-500/15 text-rose-300";
    default:
      return "bg-slate-700/50 text-slate-200";
  }
};

const RecipesPage: React.FC<RecipesPageProps> = ({ user_id: _user_id }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/recipes/categories/list");
      const data = await res.json();

      if (data.status === "success") {
        const apiCats: string[] = Array.isArray(data.categories) ? data.categories : [];
        const cleaned = Array.from(
          new Set(apiCats.filter(Boolean).filter((c) => c.toLowerCase() !== "all"))
        );
        setCategories(["All", ...cleaned]);
      }
    } catch (e) {
      console.error("Error loading categories:", e);
    }
  }, []);

  // Load recipes
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const url = `http://localhost:8000/recipes/${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "success") setRecipes(data.recipes);
      else console.error("Error loading recipes:", data.message);
    } catch (e) {
      console.error("Error loading recipes:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // glow follow-mouse di kartu (tanpa CSS global)
  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };
  const handleGlowLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* dekor blob */}
      <svg
        className="pointer-events-none absolute -left-24 -top-24 h-[36rem] w-[36rem] opacity-20 blur-3xl"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <path
          d="M53.6,-58.2C67.2,-45.5,74.9,-24.7,73.8,-5.7C72.8,13.3,63.1,26.6,49.5,38.9C36,51.3,18,62.7,-0.3,63.1C-18.5,63.6,-36.9,53.1,-49.1,39.6C-61.3,26.1,-67.3,9.6,-65.7,-6.1C-64.1,-21.7,-54.8,-36.5,-42.1,-49.5C-29.4,-62.6,-14.7,-73.9,3.1,-77.9C20.9,-81.9,41.9,-78.6,53.6,-58.2Z"
          transform="translate(100 100)"
          className="fill-amber-500/25"
        />
      </svg>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* HEADER */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl">
              📝 Recipe Collection
            </h1>
            <p className="mt-2 text-slate-300">
              Creative recipes to reduce food waste and make delicious meals
            </p>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search recipes, ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadRecipes()}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 pl-12 text-slate-100 outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400">
                🔎
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                    selectedCategory === c
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-300 shadow"
                      : "border-slate-700/60 bg-slate-900/60 text-slate-200 hover:border-amber-500/50"
                  }`}
                  title={c}
                >
                  <span className="mr-1">{categoryIcon(c)}</span>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* LOADING */}
        {loading && (
          <div className="py-14 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-amber-500" />
            <p className="mt-4 text-slate-300">Loading recipes...</p>
          </div>
        )}

        {/* LIST */}
        {!loading && (
          <section className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((r) => (
                <div
                  key={r.recipe_id}
                  onClick={() => setSelectedRecipe(r)}
                  onMouseMove={handleGlowMove}
                  onMouseLeave={handleGlowLeave}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl"
                >
                  {/* glow mengikuti kursor */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-px -z-10 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100 group-hover:blur-md"
                    style={{
                      background:
                        "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(245,158,11,.12), transparent 40%)",
                    }}
                  />
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 transition-transform duration-300 group-hover:scale-110">
                        <span className="text-xl text-white">{categoryIcon(r.category)}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-100">{r.title}</h3>
                        <p className="text-sm text-slate-400">{r.category}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${diffPill(r.difficulty)}`}>
                      {r.difficulty}
                    </span>
                  </div>

                  <p className="mb-4 line-clamp-2 text-slate-300">{r.description}</p>

                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="font-semibold text-amber-300">{r.prep_time}m</div>
                      <div className="text-slate-400">Prep Time</div>
                    </div>
                    <div>
                      <div className="font-semibold text-amber-300">{r.servings}</div>
                      <div className="text-slate-400">Servings</div>
                    </div>
                    <div>
                      <div className="font-semibold text-amber-300">{r.ingredients.length}</div>
                      <div className="text-slate-400">Ingredients</div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <span className="text-sm text-slate-400">Click to view full recipe</span>
                  </div>
                </div>
              ))}

              {recipes.length === 0 && (
                <div className="col-span-full rounded-3xl border border-slate-700/60 bg-slate-900/70 p-16 text-center shadow-xl">
                  <div className="mb-6 text-8xl">👨‍🍳</div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-100">No recipes found</h3>
                  <p className="text-slate-400">Try adjusting your search terms or selected category</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* MODAL DETAIL */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900/90 p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500">
                    <span className="text-xl text-white">{categoryIcon(selectedRecipe.category)}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">{selectedRecipe.title}</h2>
                    <p className="text-slate-300">{selectedRecipe.category}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="p-1 text-slate-400 transition-colors hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <p className="mb-6 leading-relaxed text-slate-300">{selectedRecipe.description}</p>

              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-center">
                  <div className="mb-2 text-2xl">⏱️</div>
                  <div className="font-semibold text-slate-100">{selectedRecipe.prep_time} min</div>
                  <div className="text-sm text-slate-400">Prep Time</div>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-center">
                  <div className="mb-2 text-2xl">👥</div>
                  <div className="font-semibold text-slate-100">{selectedRecipe.servings}</div>
                  <div className="text-sm text-slate-400">Servings</div>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-center">
                  <div className="mb-2 text-2xl">📊</div>
                  <div className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${diffPill(selectedRecipe.difficulty)}`}>
                    {selectedRecipe.difficulty}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">Difficulty</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-100">🛒 Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-lg bg-slate-800/60 p-2">
                        <span className="text-amber-300">•</span>
                        <span className="text-slate-200">{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-100">👨‍🍳 Instructions</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4 rounded-lg bg-slate-800/60 p-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed text-slate-200">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="pt-6 text-center">
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-amber-700 hover:to-orange-700 hover:shadow-amber-600/20"
                >
                  Close Recipe
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RecipesPage;
