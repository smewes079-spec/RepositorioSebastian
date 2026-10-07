import multer from 'multer';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

const multerComprobante = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO },
  fileFilter(req, file, cb) {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      cb(new Error('Solo se aceptan imágenes (JPG, PNG, WEBP) o PDF'));
      return;
    }
    cb(null, true);
  },
});

// Envuelve multer para devolver un error 400 con mensaje claro (tipo de
// archivo no permitido, o supera los 8 MB) en vez de caer en el manejador
// genérico de errores (que responde 500 "Error interno del servidor").
export function subirComprobanteMiddleware(req, res, next) {
  multerComprobante.single('archivo')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo supera el tamaño máximo permitido (8 MB)' });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}
