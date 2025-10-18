// =============================================
// COMPONENTE: LOGIN SCREEN
// =============================================

'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';

export default function LoginScreen() {
  const { login, state } = useApp();
  const [formData, setFormData] = useState({
    correo: '',
    contraseña: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.correo || !formData.contraseña) {
      return;
    }

    const success = await login(formData.correo, formData.contraseña);
    
    if (!success) {
      // El error ya se maneja en el contexto
      console.log('Login fallido');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-camera text-blue-600 text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GostCAM</h1>
          <p className="text-blue-200">Sistema de Inventario</p>
        </div>

        {/* Formulario de login */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de correo */}
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ejemplo@gostcam.com"
                  required
                />
                <i className="fas fa-envelope absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>

            {/* Campo de contraseña */}
            <div>
              <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="contraseña"
                  name="contraseña"
                  value={formData.contraseña}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <i className="fas fa-lock absolute left-3 top-3 text-gray-400"></i>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <i className="fas fa-exclamation-circle text-red-400 mt-0.5 mr-2"></i>
                  <span className="text-sm text-red-800">{state.error}</span>
                </div>
              </div>
            )}

            {/* Botón de login */}
            <button
              type="submit"
              disabled={state.isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.isLoading ? (
                <div className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-200 text-sm">
            © 2024 GostCAM. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}