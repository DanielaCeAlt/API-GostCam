// =============================================
// CONTEXTO GLOBAL DE LA APLICACIÓN GOSTCAM
// =============================================

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DashboardStats, LoginResponse, VistaEquipoCompleto, VistaMovimientoDetallado } from '@/types/database';
import { apiService } from '@/lib/apiService';

// ========================
// TIPOS PARA EL CONTEXTO
// ========================
interface User {
  idUsuarios: number;
  NombreUsuario: string;
  NivelUsuario: number;
  Correo: string;
  Estatus: number;
  NivelNombre?: string;
}

interface AppState {
  // Autenticación
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  
  // Estado de carga
  isLoading: boolean;
  error: string | null;
  
  // Sección activa
  currentSection: string;
  
  // Datos de la aplicación
  dashboardStats: DashboardStats | null;
  equipos: VistaEquipoCompleto[];
  movimientos: VistaMovimientoDetallado[];
  catalogos: any;
  
  // Configuración de API
  apiMode: string;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_SECTION'; payload: string }
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'SET_EQUIPOS'; payload: VistaEquipoCompleto[] }
  | { type: 'SET_MOVIMIENTOS'; payload: VistaMovimientoDetallado[] }
  | { type: 'SET_CATALOGOS'; payload: any }
  | { type: 'SET_API_MODE'; payload: string };

// ========================
// ESTADO INICIAL
// ========================
const initialState: AppState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  currentSection: 'dashboard',
  dashboardStats: null,
  equipos: [],
  movimientos: [],
  catalogos: null,
  apiMode: 'nextjs'
};

// ========================
// REDUCER
// ========================
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
        isLoading: false
      };
    
    case 'LOGOUT':
      return {
        ...initialState
      };
    
    case 'SET_SECTION':
      return { ...state, currentSection: action.payload };
    
    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload };
    
    case 'SET_EQUIPOS':
      return { ...state, equipos: action.payload };
    
    case 'SET_MOVIMIENTOS':
      return { ...state, movimientos: action.payload };
    
    case 'SET_CATALOGOS':
      return { ...state, catalogos: action.payload };
    
    case 'SET_API_MODE':
      return { ...state, apiMode: action.payload };
    
    default:
      return state;
  }
}

// ========================
// CONTEXTO
// ========================
const AppContext = createContext<{
  state: AppState;
  login: (correo: string, contraseña: string) => Promise<boolean>;
  logout: () => void;
  setSection: (section: string) => void;
  setApiMode: (mode: string) => void;
  loadDashboardStats: () => Promise<void>;
  loadEquipos: (filters?: any) => Promise<void>;
  loadMovimientos: (filters?: any) => Promise<void>;
  loadCatalogos: () => Promise<void>;
  testAltaEquipo: () => Promise<boolean>;
  getStatusColor: (status: string) => string;
  getUserRoleColor: (level: number) => string;
} | undefined>(undefined);

// ========================
// PROVIDER
// ========================
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar token desde localStorage al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('gostcam_token');
    const savedUser = localStorage.getItem('gostcam_user');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token: savedToken } });
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('gostcam_token');
        localStorage.removeItem('gostcam_user');
      }
    }
  }, []);

  // Sincronizar apiService cuando cambie el modo o token
  useEffect(() => {
    apiService.setMode(state.apiMode as 'nextjs' | 'python');
    if (state.token) {
      apiService.setToken(state.token);
    }
  }, [state.apiMode, state.token]);

  // ========================
  // FUNCIONES DE AUTENTICACIÓN
  // ========================
  const login = async (correo: string, contraseña: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Configurar el modo de API antes de hacer la petición
      apiService.setMode(state.apiMode as 'nextjs' | 'python');
      
      const data: LoginResponse = await apiService.login(correo, contraseña);

      if (data.success && data.user && data.token) {
        // Configurar token en el apiService
        apiService.setToken(data.token);
        
        // Guardar en localStorage
        localStorage.setItem('gostcam_token', data.token);
        localStorage.setItem('gostcam_user', JSON.stringify(data.user));
        
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user: data.user, token: data.token } 
        });
        
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.message || 'Error de autenticación' });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('gostcam_token');
    localStorage.removeItem('gostcam_user');
    dispatch({ type: 'LOGOUT' });
  };

  // ========================
  // FUNCIONES DE DATOS
  // ========================
  const loadDashboardStats = async () => {
    if (!state.token) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Configurar API service
      apiService.setMode(state.apiMode as 'nextjs' | 'python');
      apiService.setToken(state.token);
      
      const data = await apiService.getDashboardStats();

      if (data.success && data.data) {
        dispatch({ type: 'SET_DASHBOARD_STATS', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error cargando dashboard' });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadEquipos = async (filters?: any) => {
    if (!state.token) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Configurar API service
      apiService.setMode(state.apiMode as 'nextjs' | 'python');
      apiService.setToken(state.token);
      
      const data = await apiService.getEquipos(filters);

      if (data.success && data.data) {
        dispatch({ type: 'SET_EQUIPOS', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error cargando equipos' });
      }
    } catch (error) {
      console.error('Error loading equipos:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadMovimientos = async (filters?: any) => {
    if (!state.token) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Configurar API service
      apiService.setMode(state.apiMode as 'nextjs' | 'python');
      apiService.setToken(state.token);
      
      const data = await apiService.getMovimientos(filters);

      if (data.success && data.data) {
        dispatch({ type: 'SET_MOVIMIENTOS', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error cargando movimientos' });
      }
    } catch (error) {
      console.error('Error loading movimientos:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error de conexión' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadCatalogos = async () => {
    if (!state.token) return;
    
    try {
      // Configurar API service
      apiService.setMode(state.apiMode as 'nextjs' | 'python');
      apiService.setToken(state.token);
      
      const data = await apiService.getCatalogos();

      if (data.success) {
        dispatch({ type: 'SET_CATALOGOS', payload: data.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Error cargando catálogos' });
      }
    } catch (error) {
      console.error('Error loading catalogos:', error);
    }
  };

  // ========================
  // FUNCIONES AUXILIARES
  // ========================
  const setSection = (section: string) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  };

  const setApiMode = (mode: string) => {
    dispatch({ type: 'SET_API_MODE', payload: mode });
  };

  // Función de test para alta de equipos
  const testAltaEquipo = async (): Promise<boolean> => {
    if (!state.token) {
      console.error('No hay token de autenticación');
      return false;
    }

    try {
      console.log('🧪 Iniciando test de alta de equipo...');
      
      // Configurar API service
      apiService.setMode(state.apiMode as 'nextjs' | 'python');
      apiService.setToken(state.token);

      const equipoTest = {
        no_serie: `TEST-${Date.now()}`,
        nombreEquipo: `Equipo de Prueba ${new Date().toLocaleString()}`,
        modelo: "Modelo Test v1.0",
        idTipoEquipo: 1,
        numeroActivo: `ACT-${Date.now()}`,
        idUsuarios: 1,
        idPosicion: 1,
        idEstatus: 1
      };

      console.log('📦 Datos del equipo:', equipoTest);

      const response = await apiService.createEquipo(equipoTest);

      if (response.success) {
        console.log('✅ Equipo creado exitosamente:', response.message);
        // Recargar lista de equipos
        await loadEquipos();
        return true;
      } else {
        console.error('❌ Error creando equipo:', response.error);
        return false;
      }
    } catch (error) {
      console.error('💥 Error en test de alta:', error);
      return false;
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'Disponible': 'bg-green-100 text-green-800',
      'En uso': 'bg-blue-100 text-blue-800',
      'Mantenimiento': 'bg-yellow-100 text-yellow-800',
      'En reparación': 'bg-yellow-100 text-yellow-800',
      'Baja': 'bg-gray-100 text-gray-800',
      'Extraviado': 'bg-red-100 text-red-800',
      'Dañado': 'bg-red-100 text-red-800',
      'Obsoleto': 'bg-gray-100 text-gray-800',
      'ABIERTO': 'bg-blue-100 text-blue-800',
      'CERRADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUserRoleColor = (level: number): string => {
    const colors: { [key: number]: string } = {
      1: 'bg-purple-100 text-purple-800', // Administrador
      2: 'bg-blue-100 text-blue-800',     // Supervisor
      3: 'bg-green-100 text-green-800',   // Técnico
      4: 'bg-yellow-100 text-yellow-800', // Usuario
      5: 'bg-gray-100 text-gray-800'      // Consulta
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const value = {
    state,
    login,
    logout,
    setSection,
    setApiMode,
    loadDashboardStats,
    loadEquipos,
    loadMovimientos,
    loadCatalogos,
    testAltaEquipo,
    getStatusColor,
    getUserRoleColor
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ========================
// HOOK PERSONALIZADO
// ========================
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}