import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import FloatingChatButton from "./components/FloatingChatButton";

export default function Layout() {
  const location = useLocation();
  
  const isFoodRelatedPage = ['/product', '/donation', '/map', '/profile'].includes(location.pathname);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      
      <FloatingChatButton 
        context={isFoodRelatedPage ? 'expired' : 'general'}
      />
    </div>
  );
}
