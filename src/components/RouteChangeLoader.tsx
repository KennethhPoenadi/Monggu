import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import LoadingScreen from "../loading";

export default function RouteChangeLoader() {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => setShow(false), 300); // durasi singkat biar smooth
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
      <LoadingScreen />
    </div>
  );
}
