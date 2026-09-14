import app from '../server';

export default function handler(req: any, res: any) {
  // When running on Vercel with rewrites, Vercel sets x-forwarded-uri with the original requested path
  const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (originalUrl) {
    req.url = originalUrl;
  }
  return app(req, res);
}
