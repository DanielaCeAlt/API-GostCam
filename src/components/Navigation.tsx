// =============================================
// COMPONENTE DE NAVEGACIÓN - GOSTCAM
// =============================================

'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ThemeToggle } from '@/contexts/ThemeContext';

export default function Navigation() {
  const { state, logout, setSection, getUserRoleColor } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!state.isAuthenticated || !state.user) {
    return null;
  }

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'fas fa-home' },
    { id: 'equipos', label: 'Equipos', icon: 'fas fa-desktop' },
    { id: 'sucursales', label: 'Sucursales', icon: 'fas fa-building' },
    { id: 'fallas', label: 'Fallas', icon: 'fas fa-exclamation-triangle' },
  ];

  const handleSectionClick = (sectionId: string) => {
    setSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-camera text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">GostCAM</span>
            </div>
          </div>

          {/* Navegación - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionClick(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  state.currentSection === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.label}
              </button>
            ))}
          </div>

          {/* User info y logout - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {state.user.NombreUsuario}
                </div>
                <div className="text-xs text-gray-500">
                  {state.user.NivelNombre || `Nivel ${state.user.NivelUsuario}`}
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getUserRoleColor(state.user.NivelUsuario)}`}>
                {state.user.NivelNombre || `Nivel ${state.user.NivelUsuario}`}
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Salir
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {/* User info - Mobile */}
            <div className="px-3 py-2 bg-white rounded-md mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {state.user.NombreUsuario}
                  </div>
                  <div className="text-xs text-gray-500">
                    {state.user.Correo}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getUserRoleColor(state.user.NivelUsuario)}`}>
                  {state.user.NivelNombre || `Nivel ${state.user.NivelUsuario}`}
                </div>
              </div>
            </div>

            {/* Navigation items - Mobile */}
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  state.currentSection === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <i className={`${item.icon} mr-3 w-4`}></i>
                {item.label}
              </button>
            ))}

            {/* Logout button - Mobile */}
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors mt-3"
            >
              <i className="fas fa-sign-out-alt mr-3 w-4"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}