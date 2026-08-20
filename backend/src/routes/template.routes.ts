import { Router } from 'express';
import { getTemplateHandler, updateTemplateHandler } from '../controllers/template.controller';

const router = Router();

router.get('/template', getTemplateHandler);
router.put('/template', updateTemplateHandler);

export default router;