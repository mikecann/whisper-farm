import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./app/App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { RouteProvider } from "@/router.ts";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <RouteProvider>
            <App />
            <Toaster />
          </RouteProvider>
        </ThemeProvider>
      </ConvexProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
