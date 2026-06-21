import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AppRoutes } from "./routes";
import "./index.css";
import { Toaster } from "sonner";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "./components/SplashScreen";
import { isMainApp } from "./utils/appType";

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    const pathname = window.location.pathname;

    // Show splash ONLY on main app (not admin/staff) and homepage
    if (!isMainApp || pathname !== "/") {
      return;
    }

    // Show splash on every page load/refresh. The splash itself decides when
    // to complete (after the user picks a city, or auto-zoom for returning users).
    setShowSplash(true);
  }, []);

  return (
    <Provider store={store}>
      <Toaster
        position="top-right"
        richColors
        expand={false}
        duration={4000}
        closeButton
      />

      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        ) : (
          <AppRoutes key="app" />
        )}
      </AnimatePresence>
    </Provider>
  );
};

export default App;