import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: "GostCAM - Sistema de Inventario",
  description: "Sistema de Gestión de Inventario para GostCAM",
  keywords: "inventario, equipos, gestión, seguridad, GostCAM",
  authors: [{ name: "GostCAM Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#1f2937" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="h-full bg-gray-50 dark:bg-gray-900 transition-colors">
        <ErrorBoundary>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
