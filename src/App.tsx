import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AppRoutes } from "./routes";
import "./index.css";
import { Toaster } from "sonner";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "./components/SplashScreen";

const SESSION_KEY = "splash_seen";

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
  const pathname = window.location.pathname;

  // Show splash ONLY on homepage
  if (pathname !== "/") {
    return;
  }

  const alreadySeen = sessionStorage.getItem(SESSION_KEY);

  if (!alreadySeen) {
    setShowSplash(true);

    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem(SESSION_KEY, "true");
    }, 3000);

    return () => clearTimeout(timer);
  }
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
        {showSplash ? <SplashScreen key="splash" /> : <AppRoutes key="app" />}
      </AnimatePresence>
    </Provider>
  );
};

export default App;