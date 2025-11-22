import os
import sys
import uvicorn

# Agregar el directorio actual al path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Importar la aplicación
from main import app

if __name__ == "__main__":
    # Azure App Service usa HTTP_PLATFORM_PORT o SERVER_PORT
    port = int(os.environ.get("HTTP_PLATFORM_PORT", 
               os.environ.get("SERVER_PORT", 
               os.environ.get("PORT", 8000))))
    
    print(f"🚀 Starting GostCAM API on port {port}")
    print(f"📁 Working directory: {current_dir}")
    
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")