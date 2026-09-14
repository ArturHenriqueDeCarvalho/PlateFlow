import app from '../server';

export default function handler(req: any, res: any) {
  // Support rewritten paths (__route), custom headers, or default url
  const targetRoute = req.query?.__route || req.headers['x-forwarded-uri'];
  if (targetRoute) {
    req.url = targetRoute;
  }
  return app(req, res);
}
