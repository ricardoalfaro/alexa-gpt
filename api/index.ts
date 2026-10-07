import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildServer } from '../src/server.js';

let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    const { app } = await buildServer();
    await app.ready();
    appInstance = app;
  }
  return appInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  
  const response = await app.inject({
    method: req.method as any,
    url: req.url || '/',
    headers: req.headers as any,
    payload: req.body
  });

  res.status(response.statusCode);
  for (const [header, value] of Object.entries(response.headers)) {
    if (value !== undefined) {
      res.setHeader(header, value as string | string[]);
    }
  }
  res.send(response.body);
}
