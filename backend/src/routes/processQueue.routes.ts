import { Router } from 'express';
import { processQueue } from '../controllers/processQueue.controller';
import { verifyCronSecret } from '../middleware/cronAuth';

const router = Router();

router.post('/process-queue', verifyCronSecret, processQueue);

export default router;