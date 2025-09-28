import Navbar from "./components/navbar";
import Footer from "./components/footer";
import "./index.css";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <h1>Selamat datang di FoodLoop!</h1>
        <p>belmiro dan kenneth ganteng</p>
      </main>
      <Footer />
    </>
  );
}
