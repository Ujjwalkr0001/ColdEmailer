import { Router } from 'express';
import { validateEmails } from '../controllers/validation.controller';

const router = Router();

router.post('/validate', validateEmails);

export default router;