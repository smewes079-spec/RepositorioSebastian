import { Router } from 'express';
import multer from 'multer';
import * as gastosGeneralesController from '../controllers/gastosGenerales.controller.js';
import { parseArchivoRows } from '../lib/fileRows.js';
import { importGastosGeneralesRows } from '../services/gastosGeneralesImport.service.js';
import { subirComprobanteMiddleware } from '../lib/comprobante.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', gastosGeneralesController.index);
router.get('/resumen', gastosGeneralesController.resumen);

router.post('/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo Excel o CSV' });
  try {
    const rows = await parseArchivoRows(req.file.buffer, req.file.originalname);
    const resultado = await importGastosGeneralesRows(rows, req.user.id);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo importar el archivo' });
  }
});

router.get('/:id', gastosGeneralesController.show);
router.post('/', gastosGeneralesController.create);
router.put('/:id', gastosGeneralesController.update);
router.delete('/:id', gastosGeneralesController.destroy);

router.post('/:id/comprobante', subirComprobanteMiddleware, gastosGeneralesController.subirComprobante);
router.get('/:id/comprobante', gastosGeneralesController.descargarComprobante);
router.delete('/:id/comprobante', gastosGeneralesController.eliminarComprobante);

export default router;
