// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import NotFoundPage from "./notfound";
import LoadingScreen from "./loading";
import RouteChangeLoader from "./components/RouteChangeLoader";
import "./index.css";

const Dashboard   = lazy(() => import("./page/Dashboard"));
const DonationMap = lazy(() => import("./page/DonationMap"));
const Recipes     = lazy(() => import("./page/Recipes"));

function Home() {
  return (
    <main className="container">
      <h1>Selamat datang di FoodLoop!</h1>
      <p>belmiro dan kenneth ganteng</p>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      {/* overlay loader singkat saat ganti route */}
      <RouteChangeLoader />

      {/* Suspense: loader tampil ketika modul lazy masih diload */}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/donation-map" element={<DonationMap />} />
          <Route path="/recipe-suggestions" element={<Recipes />} />

          <Route path="/notfound" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/notfound" replace />} />
        </Routes>
      </Suspense>

      <Footer />
    </>
  );
}
