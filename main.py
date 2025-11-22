from fastapi import FastAPI, Request, Depends, HTTPException, status, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from functools import wraps
import uvicorn
import time
from typing import Optional
from utils.logger import gostcam_logger, log_api_request, log_authentication_attempt
from utils.cache import cache_manager, schedule_cache_cleanup
from dao.base_datos import obtener_sesion, verificar_conexion
from dao.UsuariosDAO import DAOUsuarios
from dao.InventarioDAO import DAOInventario
from modelos.UsuariosModel import UsuarioAutenticar, UsuarioSalida
from modelos.InventarioModel import (
    AltaEntrada, AltaSalida,
    BajaEntrada, SalidaSimple,
    EstadoEquipoEntrada,
    MovimientoActualizarEntrada, MovimientoActualizarSalida,
    MantenimientoEntrada,
    EquiposPorTipoSalida, MovimientosEquipoSalida
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Aplicación GostCAM iniciada correctamente")
    print("📊 Versión: 2.0.0")
    print("🐍 Python 3.11 runtime")
    if verificar_conexion():
        print("✅ Conexión a base de datos establecida")
    else:
        print("❌ Error de conexión a base de datos")
    
    # Inicializar limpieza automática de cache
    print("🗣️ Iniciando limpieza automática de cache...")
    schedule_cache_cleanup()
    print("✅ Sistema de cache inicializado")
    
    yield
    print("🛑 Aplicación GostCAM terminada")

app = FastAPI(
    title="Sistema de Gestión de Inventarios - GostCAM",
    description="API REST para gestión de inventarios de equipos de seguridad",
    version="2.0.0",
    lifespan=lifespan
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de monitoreo y logging
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    """
    Middleware para logging de requests y medición de tiempo de respuesta
    """
    start_time = time.time()
    
    # Extraer información del request
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    endpoint = str(request.url.path)
    method = request.method
    
    # Log de inicio de request
    gostcam_logger.info(
        f"Request iniciado: {method} {endpoint}",
        operation="api_request_start",
        extra_data={
            "endpoint": endpoint,
            "method": method,
            "client_ip": client_ip,
            "user_agent": user_agent,
            "query_params": dict(request.query_params) if request.query_params else None
        }
    )
    
    # Procesar request
    response = await call_next(request)
    
    # Calcular tiempo de respuesta
    process_time = time.time() - start_time
    process_time_ms = process_time * 1000
    
    # Determinar nivel de log basado en tiempo de respuesta
    if process_time_ms > 3000:  # Más de 3 segundos
        log_level = "WARNING"
        performance_status = "CRITICAL"
    elif process_time_ms > 1000:  # Más de 1 segundo
        log_level = "INFO"
        performance_status = "SLOW"
    else:
        log_level = "INFO"
        performance_status = "GOOD"
    
    # Log de finalización de request
    log_data = {
        "endpoint": endpoint,
        "method": method,
        "status_code": response.status_code,
        "duration_ms": round(process_time_ms, 2),
        "performance_status": performance_status,
        "client_ip": client_ip,
        "response_size": response.headers.get("content-length", "unknown")
    }
    
    message = f"Request completado: {method} {endpoint} - {response.status_code} - {process_time_ms:.2f}ms"
    
    if log_level == "WARNING":
        gostcam_logger.logger.warning(f"{message} [PERFORMANCE WARNING]")
    else:
        gostcam_logger.info(
            message,
            operation="api_request_complete",
            extra_data=log_data
        )
    
    # Agregar headers de performance
    response.headers["X-Process-Time"] = str(round(process_time_ms, 2))
    response.headers["X-Performance-Status"] = performance_status
    
    return response

seguridad = HTTPBasic()

def obtener_usuario_actual(credenciales: HTTPBasicCredentials = Depends(seguridad), sesion = Depends(obtener_sesion)):
    dao_usuarios = DAOUsuarios(sesion)
    resultado = dao_usuarios.autenticar(credenciales.username, credenciales.password)
    
    # Unificar manejo de respuesta
    exito = getattr(resultado, 'exito', resultado.get('exito', False) if isinstance(resultado, dict) else False)
    usuario = getattr(resultado, 'usuario', resultado.get('usuario') if isinstance(resultado, dict) else None)
    mensaje = getattr(resultado, 'mensaje', resultado.get('mensaje', 'No autorizado') if isinstance(resultado, dict) else 'Error en autenticación')
    
    # Log de intento de autenticación
    log_authentication_attempt(credenciales.username, exito)
    
    if not exito:
        gostcam_logger.logger.warning(
            f"Intento de autenticación fallido para usuario: {credenciales.username}"
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=mensaje)
    
    # Log de autenticación exitosa
    gostcam_logger.info(
        f"Autenticación exitosa para usuario: {credenciales.username}",
        operation="authentication_success",
        user_id=credenciales.username
    )
    
    return usuario

# ====== ENDPOINT DE HEALTH CHECK ======
@app.get("/health", summary="Health Check", description="Endpoint para verificar el estado de la API")
async def health_check():
    """
    Endpoint de health check para Azure App Service y monitoreo
    """
    try:
        # Verificar conexión a base de datos
        db_status = verificar_conexion()
        
        return {
            "status": "healthy",
            "service": "GostCAM API",
            "version": "2.0.0",
            "database": "connected" if db_status else "disconnected",
            "timestamp": time.time(),
            "cache": "active" if cache_manager else "inactive"
        }
    except Exception as e:
        gostcam_logger.logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "GostCAM API",
            "version": "2.0.0",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/", summary="API Info", description="Información básica de la API")
async def api_info():
    """
    Endpoint raíz con información de la API
    """
    return {
        "message": "GostCAM API - Sistema de Gestión de Inventarios",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

def verificar_rol(usuario, roles_permitidos: list):
    nivel = getattr(usuario, 'nivel', usuario.get('nivel') if isinstance(usuario, dict) else None)
    
    if nivel is None:
        gostcam_logger.logger.error("Error al verificar permisos: nivel de usuario no encontrado")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Error al verificar permisos")
    
    if nivel not in roles_permitidos:
        gostcam_logger.logger.warning(
            f"Acceso denegado: usuario con nivel {nivel} intentó acceder a recurso que requiere niveles {roles_permitidos}"
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permisos insuficientes")
    return usuario

# Decorador para simplificar endpoints
def endpoint_con_roles(roles_permitidos: list):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            usuario_actual = kwargs.get('usuario_actual')
            if usuario_actual:
                verificar_rol(usuario_actual, roles_permitidos)
            try:
                return await func(*args, **kwargs)
            except ValueError as error:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
            except Exception as error:
                raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))
        return wrapper
    return decorator

# 8. Obtener posiciones de una sucursal - CORREGIDO
@app.get("/posiciones/sucursal/{id_centro}", tags=["Posiciones"])
async def obtener_posiciones_sucursal(
    id_centro: str,
    usuario_actual = Depends(obtener_usuario_actual),
    sesion = Depends(obtener_sesion)
):
    """
    Obtiene todas las posiciones disponibles en una sucursal específica.
    Requiere autenticación válida.
    """
    verificar_rol(usuario_actual, [1, 2, 3, 4, 5])  # Todos los usuarios
    
    dao = DAOInventario(sesion)
    try:
        return dao.obtener_posiciones_sucursal(id_centro)
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

# 9. NUEVO: Obtener tipos de equipo
@app.get("/catalogos/tipos-equipo", tags=["Catálogos"])
@endpoint_con_roles([1, 2, 3, 4, 5])
async def obtener_tipos_equipo(
    usuario_actual = Depends(obtener_usuario_actual),
    sesion = Depends(obtener_sesion)
):
    """Obtiene todos los tipos de equipo disponibles."""
    dao = DAOInventario(sesion)
    return dao.obtener_tipos_equipo()

# 10. NUEVO: Obtener estatus de equipo
@app.get("/catalogos/estatus-equipo", tags=["Catálogos"])
async def obtener_estatus_equipo(
    usuario_actual = Depends(obtener_usuario_actual),
    sesion = Depends(obtener_sesion)
):
    """
    Obtiene todos los estatus de equipo disponibles.
    """
    verificar_rol(usuario_actual, [1, 2, 3, 4, 5])  # Todos los usuarios
    
    dao = DAOInventario(sesion)
    try:
        return dao.obtener_estatus_equipo()
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

# 11. NUEVO: Obtener sucursales
@app.get("/catalogos/sucursales", tags=["Catálogos"])
async def obtener_sucursales(
    usuario_actual = Depends(obtener_usuario_actual),
    sesion = Depends(obtener_sesion)
):
    """
    Obtiene todas las sucursales disponibles.
    """
    verificar_rol(usuario_actual, [1, 2, 3, 4, 5])  # Todos los usuarios
    
    dao = DAOInventario(sesion)
    try:
        return dao.obtener_sucursales()
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.get("/")
async def ruta_raiz():
    return {
        "api": "GostCAM Inventarios",
        "version": "2.0.0",
        "status": "activo",
        "docs": "/docs"
    }

@app.post("/equipos/alta", response_model=AltaSalida, tags=["Equipos"])
async def registrar_alta_equipo(equipo: AltaEntrada, request: Request, usuario_actual = Depends(obtener_usuario_actual), sesion = Depends(obtener_sesion)):
    verificar_rol(usuario_actual, [1, 2])
    dao = DAOInventario(sesion)
    try:
        return dao.registrar_alta(equipo.model_dump())
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.post("/equipos/baja", response_model=SalidaSimple, tags=["Equipos"])
async def registrar_baja_equipo(datos: BajaEntrada, usuario_actual = Depends(obtener_usuario_actual), sesion = Depends(obtener_sesion)):
    verificar_rol(usuario_actual, [1, 2])
    dao = DAOInventario(sesion)
    try:
        return dao.registrar_baja(datos.model_dump())
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.put("/equipos/estado", response_model=SalidaSimple, tags=["Equipos"])
async def actualizar_estado_equipo(datos: EstadoEquipoEntrada, usuario_actual = Depends(obtener_usuario_actual), sesion = Depends(obtener_sesion)):
    verificar_rol(usuario_actual, [1, 2, 3])
    dao = DAOInventario(sesion)
    try:
        return dao.actualizar_estado(datos.model_dump())
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.put("/movimientos/actualizar", response_model=MovimientoActualizarSalida, tags=["Movimientos"])
async def actualizar_movimiento(datos: MovimientoActualizarEntrada, usuario_actual = Depends(obtener_usuario_actual), sesion = Depends(obtener_sesion)):
    verificar_rol(usuario_actual, [1, 2])
    dao = DAOInventario(sesion)
    try:
        return dao.actualizar_movimiento(datos.model_dump())
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.get("/equipos/listar", tags=["Equipos"])
async def listar_equipos_paginado(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(50, ge=1, le=200, description="Elementos por página"),
    tipo_equipo: Optional[str] = Query(None, description="Filtro por tipo de equipo"),
    estatus: Optional[int] = Query(None, description="Filtro por estatus"),
    sucursal: Optional[str] = Query(None, description="Filtro por sucursal"),
    usuario_actual = Depends(obtener_usuario_actual),
    sesion = Depends(obtener_sesion)
):
    """
    Lista equipos con paginación y filtros opcionales.
    Soporta filtros por tipo de equipo, estatus y sucursal.
    """
    verificar_rol(usuario_actual, [1, 2, 3, 4, 5])  # Todos los usuarios
    
    dao = DAOInventario(sesion)
    try:
        return dao.listar_equipos_paginado(page, limit, tipo_equipo, estatus, sucursal)
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.get("/movimientos/listar-por-tipo/{tipo_movimiento}", response_model=EquiposPorTipoSalida, tags=["Movimientos"])
async def listar_por_tipo_movimiento(
    tipo_movimiento: str,
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(50, ge=1, le=200, description="Elementos por página"),
    usuario_actual = Depends(obtener_usuario_actual), 
    sesion = Depends(obtener_sesion)
):
    verificar_rol(usuario_actual, [1, 2, 4, 5])
    dao = DAOInventario(sesion)
    try:
        return dao.listar_por_tipo_paginado(tipo_movimiento, page, limit)
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.post("/equipos/mantenimiento", response_model=SalidaSimple, tags=["Equipos"])
async def registrar_mantenimiento(datos: MantenimientoEntrada, usuario_actual = Depends(obtener_usuario_actual), sesion = Depends(obtener_sesion)):
    verificar_rol(usuario_actual, [1, 2, 3])
    dao = DAOInventario(sesion)
    try:
        return dao.registrar_mantenimiento(datos.model_dump())
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.get("/movimientos/consultar", response_model=MovimientosEquipoSalida, tags=["Movimientos"])
async def consultar_movimientos(id_equipo: str, usuario_actual = Depends(obtener_usuario_actual), sesion = Depends(obtener_sesion)):
    verificar_rol(usuario_actual, [1, 2, 4, 5])
    dao = DAOInventario(sesion)
    try:
        return dao.consultar_movimientos_equipo(id_equipo)
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.get("/admin/cache/stats", tags=["Administración"])
async def obtener_estadisticas_cache(
    usuario_actual = Depends(obtener_usuario_actual)
):
    """
    Obtiene estadísticas del cache del sistema.
    Solo administradores.
    """
    verificar_rol(usuario_actual, [1])  # Solo administradores
    
    try:
        stats = cache_manager.get_cache_statistics()
        health = cache_manager.get_cache_health()
        
        return {
            "estado": "success",
            "estadisticas": stats,
            "salud": health
        }
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.post("/admin/cache/cleanup", tags=["Administración"])
async def limpiar_cache_expirado(
    usuario_actual = Depends(obtener_usuario_actual)
):
    """
    Limpia entradas expiradas del cache.
    Solo administradores.
    """
    verificar_rol(usuario_actual, [1])  # Solo administradores
    
    try:
        eliminated_count = cache_manager.cleanup_expired_entries()
        
        gostcam_logger.info(
            f"Cache cleanup manual: {eliminated_count} entradas eliminadas",
            operation="cache_cleanup",
            user_id=getattr(usuario_actual, 'id', 'unknown')
        )
        
        return {
            "estado": "success",
            "mensaje": f"Se eliminaron {eliminated_count} entradas expiradas del cache",
            "entradas_eliminadas": eliminated_count
        }
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.post("/admin/cache/invalidate", tags=["Administración"])
async def invalidar_cache_catalogos(
    usuario_actual = Depends(obtener_usuario_actual)
):
    """
    Invalida cache de catálogos estáticos.
    Solo administradores.
    """
    verificar_rol(usuario_actual, [1])  # Solo administradores
    
    try:
        cache_manager.invalidate_catalogs()
        
        gostcam_logger.info(
            "Cache de catálogos invalidado manualmente",
            operation="cache_invalidation",
            user_id=getattr(usuario_actual, 'id', 'unknown')
        )
        
        return {
            "estado": "success",
            "mensaje": "Cache de catálogos invalidado correctamente"
        }
    except Exception as error:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@app.post("/autenticacion/iniciar-sesion", response_model=UsuarioSalida, tags=["Autenticación"])
async def iniciar_sesion(datos: UsuarioAutenticar, sesion = Depends(obtener_sesion)):
    """Iniciar sesión con email y contraseña"""
    dao_usuarios = DAOUsuarios(sesion)
    try:
        resultado = dao_usuarios.autenticar(datos.correo, datos.contraseña)
        exito = getattr(resultado, 'exito', resultado.get('exito', False) if isinstance(resultado, dict) else False)
        mensaje = getattr(resultado, 'mensaje', resultado.get('mensaje', 'Credenciales inválidas') if isinstance(resultado, dict) else 'Error de autenticación')
        
        if not exito:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=mensaje)
        return resultado
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {str(error)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)