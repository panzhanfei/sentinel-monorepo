import { Router } from 'express';
import { getNonce } from '@/controllers';

const nonceRouter = Router();

nonceRouter.get('/nonce', getNonce);

export default nonceRouter;
