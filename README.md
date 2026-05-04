# TaskFlow - Plataforma de Gestión de Tareas

Plataforma interna para la gestión eficiente de tareas diarias, con integración de correo electrónico, priorización automática y reportes de productividad.

## Funcionalidades

- **Integración con correo electrónico**: Extrae automáticamente tareas de tu bandeja via IMAP (Gmail, Outlook, Yahoo, etc.)
- **Gestión manual de tareas**: Crea, edita y elimina tareas con formulario intuitivo
- **Priorización automática (Matriz de Eisenhower)**:
  - 🔴 **Crítica**: Urgente + Importante → Hacer ahora
  - 🔵 **Importante**: No urgente + Importante → Planificar
  - 🟡 **Urgente**: Urgente + No importante → Delegar
  - ⚪ **Baja**: No urgente + No importante → Eliminar
- **Resumen diario**: Tasa de completado, tareas críticas, progreso en tiempo real
- **Notificaciones y recordatorios**: Sistema de alertas automático (revisa cada minuto)
- **Reportes semanales**: Estadísticas, gráficos de productividad y sugerencias personalizadas

## Puesta en marcha

### Con Docker (recomendado)

```bash
docker-compose up --build
```

Abre http://localhost:3000

### Desarrollo local

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:3000

## Configuración de correo (Gmail)

1. Activa IMAP en Gmail: Configuración → Ver todos los ajustes → Reenvío e IMAP
2. Si usas verificación en 2 pasos, genera una **Contraseña de aplicación**
3. En TaskFlow → Configuración → Integración de Correo, ingresa tus datos
4. Haz clic en **Sincronizar** para importar tareas

## Tecnologías

- **Backend**: Python + FastAPI + SQLAlchemy + SQLite
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Gráficos**: Recharts
- **Email**: IMAP (imaplib)
- **Despliegue**: Docker + Nginx
