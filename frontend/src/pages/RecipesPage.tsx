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

const RecipesPage: React.FC<RecipesPageProps> = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Load recipes from API
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const url = `http://localhost:8000/recipes/${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "success") {
        setRecipes(data.recipes);
      } else {
        console.error("Error loading recipes:", data.message);
      }
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/recipes/categories/list"
      );
      const data = await response.json();

      if (data.status === "success") {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Recipes are already filtered by the API
  const filteredRecipes = recipes;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-4">
              📝 Recipe Collection
            </h1>
            <p className="text-gray-600 text-lg">
              Creative recipes to reduce food waste and make delicious meals
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search recipes, ingredients..."
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    loadRecipes();
                  }
                }}
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </span>
            </div>

            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-2xl transition-all duration-300 font-semibold text-sm ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span>{getCategoryIcon(category)}</span>
                    {category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">
              Loading recipes...
            </p>
          </div>
        )}
        {/* Recipes Grid */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.recipe_id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center">
                      <span className="text-xl text-white">
                        {getCategoryIcon(recipe.category)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {recipe.title}
                      </h3>
                      <p className="text-sm text-gray-500">{recipe.category}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                      recipe.difficulty
                    )}`}
                  >
                    {recipe.difficulty}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {recipe.description}
                </p>

                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-orange-600 font-semibold">
                      {recipe.prep_time}m
                    </div>
                    <div className="text-gray-500">Prep Time</div>
                  </div>
                  <div>
                    <div className="text-orange-600 font-semibold">
                      {recipe.servings}
                    </div>
                    <div className="text-gray-500">Servings</div>
                  </div>
                  <div>
                    <div className="text-orange-600 font-semibold">
                      {recipe.ingredients.length}
                    </div>
                    <div className="text-gray-500">Ingredients</div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-sm text-gray-500">
                    Click to view full recipe
                  </span>
                </div>
              </div>
            ))}

            {filteredRecipes.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl shadow-lg">
                <div className="text-8xl mb-6">👨‍🍳</div>
                <h3 className="text-2xl font-bold text-gray-600 mb-3">
                  No recipes found
                </h3>
                <p className="text-gray-500 text-lg">
                  Try adjusting your search terms or selected category
                </p>
              </div>
            )}
          </div>
        )}{" "}
        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center">
                    <span className="text-xl text-white">
                      {getCategoryIcon(selectedRecipe.category)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedRecipe.title}
                    </h2>
                    <p className="text-gray-600">{selectedRecipe.category}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecipe(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {selectedRecipe.description}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-orange-50 rounded-2xl">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="font-semibold text-gray-800">
                    {selectedRecipe.prep_time} min
                  </div>
                  <div className="text-sm text-gray-500">Prep Time</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-2xl">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-semibold text-gray-800">
                    {selectedRecipe.servings}
                  </div>
                  <div className="text-sm text-gray-500">Servings</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-2xl">
                  <div className="text-2xl mb-2">📊</div>
                  <div
                    className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${getDifficultyColor(
                      selectedRecipe.difficulty
                    )}`}
                  >
                    {selectedRecipe.difficulty}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Difficulty</div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>🛒</span>
                    Ingredients
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-orange-600">•</span>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>👨‍🍳</span>
                    Instructions
                  </h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li
                        key={index}
                        className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white text-sm font-bold rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed">
                          {instruction}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-semibold px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Close Recipe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipesPage;
