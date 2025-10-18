// =============================================
// PÁGINA PRINCIPAL - GOSTCAM
// =============================================

'use client';

import React from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import LoginScreen from '@/components/LoginScreen';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import EquiposManager from '@/components/equipos/EquiposManager';
import Sucursales from '@/components/Sucursales';
import Fallas from '@/components/Fallas';

// Componente interno que usa el contexto
function AppContent() {
  const { state } = useApp();

  // Si no está autenticado, mostrar login
  if (!state.isAuthenticated) {
    return <LoginScreen />;
  }

  // Renderizar contenido basado en la sección actual
  const renderContent = () => {
    switch (state.currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'equipos':
        return (
          <div className="p-6">
            <EquiposManager />
          </div>
        );
      case 'sucursales':
        return <Sucursales />;
      case 'fallas':
        return <Fallas />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
}

// Componente principal con Provider
export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}