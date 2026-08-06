import { Router } from 'express';
import multer from 'multer';
import * as ventasController from '../controllers/ventas.controller.js';
import { importVentasCsv } from '../services/csvImport.service.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', ventasController.index);
router.get('/resumen', ventasController.resumen);
router.get('/:id', ventasController.show);
router.post('/', ventasController.create);
router.put('/:id', ventasController.update);
router.delete('/:id', ventasController.destroy);
router.patch('/:id/kanban', ventasController.moveKanban);

router.post('/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo CSV' });
  try {
    const resultado = await importVentasCsv(req.file.buffer.toString('utf-8'));
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo importar el archivo' });
  }
});

export default router;
