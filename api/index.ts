import { app, registerRoutesPromise } from '../server/app';
import type { Request, Response } from 'express';

export default async (req: Request, res: Response) => {
    await registerRoutesPromise;
    app(req, res);
};
