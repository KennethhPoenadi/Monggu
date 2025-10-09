import React, { useState } from "react";
import FoodClassifier from "../components/FoodClassifier";

interface FoodAnalysis {
  primary_food_type: string;
  confidence: number;
  alternative_types: string[];
  is_food: boolean;
  detailed_predictions: Array<{
    food_type: string;
    confidence: number;
    category_id: number;
  }>;
}

const AIFoodPage: React.FC = () => {
  const [detectedFoods, setDetectedFoods] = useState<
    Array<{
      foodType: string;
      analysis: FoodAnalysis;
      timestamp: Date;
    }>
  >([]);

  const handleFoodDetected = (foodType: string, analysis: FoodAnalysis) => {
    setDetectedFoods((prev) => [
      { foodType, analysis, timestamp: new Date() },
      ...prev.slice(0, 4), // keep last 5
    ]);
  };

  const clearHistory = () => setDetectedFoods([]);

  // Glow yang ngikutin kursor (tanpa CSS global)
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

  const confidenceChip = (c: number) =>
    c >= 0.7
      ? "bg-emerald-500/15 text-emerald-300"
      : c >= 0.5
      ? "bg-sky-500/15 text-sky-300"
      : "bg-amber-500/15 text-amber-300";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      {/* dekor blob ala NotFound */}
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
        {/* Header (frosted) */}
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8 shadow-xl backdrop-blur-xl">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              🤖 AI Food Detection
            </h1>
            <p className="mt-3 text-slate-300 max-w-2xl mx-auto">
              Upload food photos and let our computer vision detect and classify them
              in seconds.
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Kartu Food Classifier */}
          <section
            onMouseMove={handleGlowMove}
            onMouseLeave={handleGlowLeave}
            className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl"
          >
            {/* glow mengikuti kursor */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-0 blur transition-opacity duration-300 group-hover:opacity-100 group-hover:blur-md"
              style={{
                background:
                  "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(16,185,129,.12), transparent 40%)",
              }}
            />
            <h3 className="mb-4 text-xl font-bold text-slate-100">📸 Classify Your Food</h3>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <FoodClassifier
                onFoodDetected={handleFoodDetected}
                className="rounded-lg border border-emerald-500/30 bg-slate-900/60"
              />
            </div>

            {/* Info fitur */}
            <div className="mt-6 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
              <h4 className="mb-3 text-lg font-semibold text-slate-100">✨ AI Features</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                    🎯
                  </span>
                  <div>
                    <p className="font-medium text-slate-200">Accurate Detection</p>
                    <p className="text-sm text-slate-400">Identifies 20+ food categories</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15">
                    ⚡
                  </span>
                  <div>
                    <p className="font-medium text-slate-200">Real-time Analysis</p>
                    <p className="text-sm text-slate-400">Instant classification</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15">
                    📊
                  </span>
                  <div>
                    <p className="font-medium text-slate-200">Confidence Score</p>
                    <p className="text-sm text-slate-400">See prediction certainty</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15">
                    🔄
                  </span>
                  <div>
                    <p className="font-medium text-slate-200">Multiple Suggestions</p>
                    <p className="text-sm text-slate-400">Alternative food candidates</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Kartu Detection History */}
          <section
            onMouseMove={handleGlowMove}
            onMouseLeave={handleGlowLeave}
            className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-xl backdrop-blur-xl"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-0 blur transition-opacity duration-300 group-hover:opacity-100 group-hover:blur-md"
              style={{
                background:
                  "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(56,189,248,.12), transparent 40%)",
              }}
            />
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">📋 Detection History</h3>
              {detectedFoods.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Clear History
                </button>
              )}
            </div>

            {detectedFoods.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-slate-700/60 bg-slate-900/60 p-12 text-center">
                <div className="mb-3 text-6xl">🤖</div>
                <p className="text-lg text-slate-300">No detections yet</p>
                <p className="text-sm text-slate-500">
                  Upload an image to see AI analysis results
                </p>
              </div>
            ) : (
              <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
                {detectedFoods.map((d, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 text-white">
                          🍽️
                        </span>
                        <div>
                          <h4 className="font-semibold text-slate-100">{d.foodType}</h4>
                          <p className="text-xs text-slate-400">
                            {d.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${confidenceChip(
                          d.analysis.confidence
                        )}`}
                      >
                        {(d.analysis.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {d.analysis.alternative_types.length > 0 && (
                      <div className="mb-2">
                        <p className="mb-1 text-xs text-slate-400">Alternatives:</p>
                        <div className="flex flex-wrap gap-1">
                          {d.analysis.alternative_types.slice(0, 3).map((type, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`flex items-center gap-1 ${
                          d.analysis.is_food ? "text-emerald-300" : "text-amber-300"
                        }`}
                      >
                        {d.analysis.is_food ? "✅ Food" : "⚠️ Uncertain"}
                      </span>
                      <span className="text-slate-400">
                        {d.analysis.detailed_predictions.length} predictions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Tips (frosted) */}
        <section className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <h3 className="mb-4 text-xl font-bold text-slate-100">💡 Tips for Better Results</h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-emerald-300">📸</span>
              <div>
                <p className="font-semibold text-slate-200">Good Lighting</p>
                <p className="text-slate-400">Take photos in well-lit conditions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-sky-300">🎯</span>
              <div>
                <p className="font-semibold text-slate-200">Clear Focus</p>
                <p className="text-slate-400">Make sure food is the main subject</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-violet-300">📏</span>
              <div>
                <p className="font-semibold text-slate-200">Close-up Shots</p>
                <p className="text-slate-400">Get closer for better detail</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-amber-300">🔧</span>
              <div>
                <p className="font-semibold text-slate-200">Single Item</p>
                <p className="text-slate-400">Best with one main food item</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AIFoodPage;
