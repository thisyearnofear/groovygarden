
import './logger.ts';
import { StrictMode, useEffect, useState, useRef, createContext, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Fallback from "./Fallback.tsx";
import SystemErrorBoundary from "./SystemErrorBoundary.tsx";
import "./index.css";
// Screenshot component removed - was for Solar platform integration
import Router from "./components/Router.tsx";
import { client } from './lib/sdk/client.gen';
// Configure API client based on environment
const isProduction = import.meta.env.PROD;
const protocol = isProduction ? "https://" : "http://";

// More robust URL construction
let baseUrl;
if (isProduction) {
  // In production, assume backend is on same domain
  baseUrl = protocol + window.location.host;
} else {
  // In development, frontend is on 5173, backend is on 8000
  baseUrl = protocol + window.location.hostname + ":8000";
}

console.log('🔧 API Client Config:', {
  isProduction,
  protocol,
  baseUrl,
  hostname: window.location.hostname,
  port: window.location.port,
  fullUrl: window.location.href
});

client.setConfig({
  baseUrl: baseUrl,
});
import { AuthProvider } from "@/auth/AuthProvider.tsx";

export const AuthTokenContext = createContext<string | null>(null);
const Root = () => {
  Element.prototype.scrollIntoView = function() { return false; };
  Element.prototype.scrollTo = function() { return false; };
  Element.prototype.scrollBy = function() { return false; };

  return (
    <>
      <AuthProvider
      client={client}
      clientId={"degen-dancing-hackathon"}
      baseInfranodeUrl={baseUrl}
      appName={"DegenDancing - AI-Powered Dance Chains"}
      >
        <BrowserRouter>
          <Routes>
            <Route path="*" element={
              <SystemErrorBoundary viewName="Fallback">
                <Suspense fallback={<div>Loading...</div>}>
                  <Router />
                </Suspense>
              </SystemErrorBoundary>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}

createRoot(document.getElementById("root")).render(<Root />);
