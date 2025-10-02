import { Routes, Route, Navigate} from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import NotFoundPage from "./notfound";  
import "./index.css";

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
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/donation-map" element={<DonationMap />} /> */}
        {/* <Route path="/recipe-suggestions" element={<Recipes />} /> */}
        
        {/* Halaman 404 eksplisit */}
        <Route path="/notfound" element={<NotFoundPage />} />

        {/* Wildcard redirect ke /notfound */}
        <Route path="*" element={<Navigate to="/notfound" replace />} />
      </Routes>
      <Footer />
    </>
  );
}


