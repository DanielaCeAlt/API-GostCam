'use client';

import React from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import LoginScreen from '@/components/LoginScreen';
import Navigation from '@/components/Navigation';
import EquiposManager from '@/components/equipos/EquiposManager';

// Componente interno que usa el contexto
function EquiposContent() {
  const { state } = useApp();

  // Si no está autenticado, mostrar login
  if (!state.isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EquiposManager />
      </div>
    </div>
  );
}

// Componente principal envuelto en AppProvider
export default function EquiposPage() {
  return (
    <AppProvider>
      <EquiposContent />
    </AppProvider>
  );
}