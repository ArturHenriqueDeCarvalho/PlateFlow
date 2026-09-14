import type { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '') || (req.headers['x-auth-token'] as string);

  if (!token || !token.startsWith('mock_token_admin_')) {
    return reply.status(401).send({
      error: 'Não autorizado. Faça login como administrador para realizar alterações.',
    });
  }
}
