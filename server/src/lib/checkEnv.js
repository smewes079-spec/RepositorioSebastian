const REQUIRED_VARS = ['DATABASE_URL', 'SESSION_SECRET', 'APP_PASSWORD'];

export function checkRequiredEnv() {
  const faltantes = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (faltantes.length > 0) {
    console.error(
      `No se pudo iniciar el servidor: faltan estas variables de entorno: ${faltantes.join(', ')}. ` +
        'Revisa la configuración en Render (Settings → Environment Variables) o el archivo .env en desarrollo.'
    );
    process.exit(1);
  }
}
