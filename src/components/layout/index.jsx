import { useEffect, useState } from "react";
import classnames from "classnames";
import { Header, Sidebar, LocationButton } from "@/components";

export const Layout = ({ children, className = "" }) => {
  const [viewportHeight, setViewportHeight] = useState("100vh");
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    setIsTelegramWebApp(!!tg);

    const setHeight = () => {
      const vh = window.innerHeight * 0.01;
      setViewportHeight(`${vh}px`);
    };

    setHeight();
    window.addEventListener("resize", setHeight);
    return () => window.removeEventListener("resize", setHeight);
  }, []);

  return (
    <div
      className={classnames(className, "fixed min-h-screen w-full bg-white")}
      style={{
        height: isTelegramWebApp ? "100%" : viewportHeight,
        paddingTop: isTelegramWebApp ? "0" : "env(safe-area-inset-top)",
        paddingBottom: isTelegramWebApp ? "0" : "env(safe-area-inset-bottom)",
      }}
    >
      <Header />

      {children}

      <Sidebar />

      <LocationButton />
    </div>
  );
};
