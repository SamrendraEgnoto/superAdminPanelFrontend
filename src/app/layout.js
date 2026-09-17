import "../styles/globals.css";
import "../styles/main.scss";
import { AuthProvider } from "../context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext"; // Added provider
import { Toaster } from "react-hot-toast";
import QueryProvider from "./QueryProvider";

export const metadata = {
  title: "3D Estimator Admin",
  description: "Estimator Admin Panel",
};

import MainLayout from "../components/MainLayout";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <SettingsProvider> {/* Added Provider */}
              <MainLayout>
                {children}
              </MainLayout>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                  },
                }}
              />
            </SettingsProvider> {/* Added Provider closing tag */}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}


