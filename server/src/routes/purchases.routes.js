import { Router } from 'express';
import multer from 'multer';
import * as purchasesController from '../controllers/purchases.controller.js';
import { parseArchivoRows } from '../lib/fileRows.js';
import { importComprasRows } from '../services/comprasImport.service.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/', purchasesController.index);
router.get('/resumen', purchasesController.resumen);

router.post('/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Debes adjuntar un archivo Excel o CSV' });
  try {
    const rows = await parseArchivoRows(req.file.buffer, req.file.originalname);
    const resultado = await importComprasRows(rows);
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'No se pudo importar el archivo' });
  }
});

router.get('/:id', purchasesController.show);
router.post('/', purchasesController.create);
router.put('/:id', purchasesController.update);
router.delete('/:id', purchasesController.destroy);

export default router;
