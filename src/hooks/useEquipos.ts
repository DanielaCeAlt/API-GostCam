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
  usuarioAsignado: string;
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
        const equiposData = Array.isArray(response.data) ? response.data : [];
        setEquipos(equiposData);
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
      // Construir parámetros de query para la API existente
      const params = new URLSearchParams();
      
      if (filtros.texto && filtros.texto.trim() !== '') {
        params.append('busqueda', filtros.texto.trim());
      }
      
      // Para tipo de equipo y estatus, necesitamos convertir el ID al nombre
      // Ya que la API espera nombres, no IDs
      if (filtros.tipoEquipo && filtros.tipoEquipo !== '') {
        // Si es un número (ID), necesitamos obtener el nombre del catálogo
        // Por ahora, asumimos que se envía el nombre directamente desde el componente
        params.append('tipoEquipo', filtros.tipoEquipo);
      }
      if (filtros.estatus && filtros.estatus !== '') {
        params.append('estatus', filtros.estatus);
      }
      if (filtros.sucursal && filtros.sucursal !== '') {
        params.append('sucursal', filtros.sucursal);
      }
      if (filtros.usuarioAsignado && filtros.usuarioAsignado !== '') {
        params.append('usuario', filtros.usuarioAsignado);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/api/equipos?${queryString}` : '/api/equipos';
      
      const response = await apiService.get(url);
      if (response.success) {
        const equiposData = Array.isArray(response.data) ? response.data : [];
        setEquipos(equiposData);
        // La API existente no devuelve paginación, usar valores por defecto
        setPaginacion({
          paginaActual: 1,
          totalPaginas: 1,
          totalRegistros: equiposData.length,
          hayAnterior: false,
          haySiguiente: false
        });
        return equiposData; // Devolver los resultados directamente
      } else {
        setEquipos([]);
        return [];
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setEquipos([]);
      return [];
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