import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useMetrika(counterId) {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.ym === "function") {
      const url = location.pathname + location.search + location.hash;
      window.ym(counterId, "hit", url, { title: document.title });
    }
  }, [location, counterId]);
}
