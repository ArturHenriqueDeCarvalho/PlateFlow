import type { FastifyReply, FastifyRequest } from 'fastify';

const FORBIDDEN_ORIGIN = { error: 'Origem não permitida.' };

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function parseAppOrigins(): string[] {
  return (process.env.APP_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function requireOrigin(req: FastifyRequest, reply: FastifyReply) {
  if (!MUTATING.has(req.method)) {
    return;
  }

  const origin = req.headers.origin;
  if (origin == null || origin === '') {
    return;
  }

  const allowed = parseAppOrigins();
  if (!allowed.includes(String(origin))) {
    return reply.status(403).send(FORBIDDEN_ORIGIN);
  }
}
