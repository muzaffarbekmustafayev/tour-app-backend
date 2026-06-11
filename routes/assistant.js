import express from 'express';
import { askAssistant } from '../controllers/assistantController.js';

const router = express.Router();

// Public — kirish (auth) talab qilinmaydi, mehmonlar ham foydalanishi mumkin
// POST /api/assistant   body: { message }
router.post('/', askAssistant);

export default router;
