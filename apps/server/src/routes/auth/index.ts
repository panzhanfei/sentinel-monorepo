import { Router } from 'express';
import nonceRouter from './nonce.route';

const authRouter = Router();

authRouter.use('/auth', nonceRouter);

export default authRouter;
