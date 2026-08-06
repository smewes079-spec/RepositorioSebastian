import { Router } from 'express';
import multer from 'multer';
import * as ventasController from '../controllers/ventas.controller.js';
import { parseArchivoVentas, importVentasRows } from '../services/csvImport.service.js';
import * as costeoService from '../services/costeo.service.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', ventasController.index);
router.get('/resumen', ventasController.resumen);
router.get('/:id/costo', async (req, res) => {
  const ficha = await costeoService.getFichaCosto(req.params.id);
  if (!ficha) return res.status(404).json({ error: 'Venta no encontrada' });
  res.json(ficha);
});
router.get('/:id', ventasController.show);
router.post('/', ventasController.create);
router.put('/:id', ventasController.update);
router.delete('/:id', ventasController.destroy);
router.patch('/:id/kanban', ventasController.moveKanban);

router.post('/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo Excel o CSV' });
  try {
    const rows = await parseArchivoVentas(req.file.buffer, req.file.originalname);
    const resultado = await importVentasRows(rows);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo importar el archivo' });
  }
});

export default router;
