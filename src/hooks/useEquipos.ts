'use client';

import { useState, useCallback } from 'react';
import { apiService } from '@/lib/apiService';

interface Equipo {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  numeroActivo: string;
  TipoEquipo: string;
  EstatusEquipo: string;
  SucursalActual: string;
  AreaActual: string;
  UsuarioAsignado: string;
  fechaAlta: string;
  diasEnSistema?: number;
  valorEstimado?: number;
}

interface FiltrosBusqueda {
  texto: string;
  tipoEquipo: string;
  estatus: string;
  sucursal: string;
  fechaAltaDesde: string;
  fechaAltaHasta: string;
  limite: number;
  pagina: number;
}

interface Paginacion {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  hayAnterior: boolean;
  haySiguiente: boolean;
}

export function useEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [paginacion, setPaginacion] = useState<Paginacion>({
    paginaActual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    hayAnterior: false,
    haySiguiente: false
  });
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  const [detallesEquipo, setDetallesEquipo] = useState<any>(null);

  const cargarEquipos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/equipos');
      if (response.success) {
        setEquipos(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando equipos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarEquipos = useCallback(async (filtros: FiltrosBusqueda) => {
    setLoading(true);
    try {
      const response = await apiService.post('/api/equipos/search', filtros);
      if (response.success) {
        setEquipos(response.data || []);
        setPaginacion(response.pagination || {
          paginaActual: 1,
          totalPaginas: 1,
          totalRegistros: 0,
          hayAnterior: false,
          haySiguiente: false
        });
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const verDetallesEquipo = useCallback(async (noSerie: string) => {
    setLoading(true);
    try {
      const response = await apiService.get(`/api/equipos/${noSerie}`);
      if (response.success) {
        setDetallesEquipo(response.data);
        setEquipoSeleccionado(noSerie);
      }
    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearEquipo = useCallback(async (datosEquipo: any) => {
    setLoading(true);
    try {
      const response = await apiService.post('/api/equipos', datosEquipo);
      if (response.success) {
        await cargarEquipos(); // Recargar lista
        return { success: true, message: response.message };
      }
      return { success: false, message: response.error || 'Error creando equipo' };
    } catch (error) {
      console.error('Error creando equipo:', error);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, [cargarEquipos]);

  const actualizarEquipo = useCallback(async (noSerie: string, datosEquipo: any) => {
    setLoading(true);
    try {
      const response = await apiService.put(`/api/equipos/${noSerie}`, datosEquipo);
      if (response.success) {
        await cargarEquipos(); // Recargar lista
        return { success: true, message: response.message };
      }
      return { success: false, message: response.error || 'Error actualizando equipo' };
    } catch (error) {
      console.error('Error actualizando equipo:', error);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, [cargarEquipos]);

  const eliminarEquipo = useCallback(async (noSerie: string) => {
    setLoading(true);
    try {
      const response = await apiService.delete(`/api/equipos/${noSerie}`);
      if (response.success) {
        await cargarEquipos(); // Recargar lista
        return { success: true, message: response.message };
      }
      return { success: false, message: response.error || 'Error eliminando equipo' };
    } catch (error) {
      console.error('Error eliminando equipo:', error);
      return { success: false, message: 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }, [cargarEquipos]);

  return {
    equipos,
    loading,
    paginacion,
    equipoSeleccionado,
    detallesEquipo,
    cargarEquipos,
    buscarEquipos,
    verDetallesEquipo,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo,
    setEquipoSeleccionado,
    setDetallesEquipo
  };
}