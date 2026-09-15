import { Router } from 'express';
import multer from 'multer';
import * as cotizacionesController from '../controllers/cotizaciones.controller.js';
import { parseArchivoRows } from '../lib/fileRows.js';
import { importCotizacionesRows } from '../services/cotizacionesImport.service.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo Excel o CSV' });
  try {
    const rows = await parseArchivoRows(req.file.buffer, req.file.originalname);
    const resultado = await importCotizacionesRows(rows);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo importar el archivo' });
  }
});

router.get('/', cotizacionesController.index);
router.get('/:id', cotizacionesController.show);
router.get('/:id/pdf', cotizacionesController.pdf);
router.post('/', cotizacionesController.create);
router.put('/:id', cotizacionesController.update);
router.delete('/:id', cotizacionesController.destroy);
router.post('/:id/enviar', cotizacionesController.enviar);
router.post('/:id/aceptar', cotizacionesController.aceptar);
router.post('/:id/rechazar', cotizacionesController.rechazar);

export default router;
