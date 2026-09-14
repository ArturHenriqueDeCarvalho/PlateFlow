import type { FastifyRequest, FastifyReply } from 'fastify';

export class AuthController {
  async login(req: FastifyRequest<{ Body: { email?: string; password?: string } }>, reply: FastifyReply) {
    const { email, password } = req.body || {};
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@plateflow.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'plateflow2026';

    if (email === adminEmail && password === adminPassword) {
      const token = `mock_token_admin_${Date.now()}`;
      return reply.send({
        token,
        user: {
          email,
          name: 'Administrador Gráfica',
          role: 'admin',
        },
      });
    }

    return reply.status(401).send({ error: 'Credenciais inválidas.' });
  }

  async me(req: FastifyRequest, reply: FastifyReply) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, '') || (req.headers['x-auth-token'] as string);

    if (token && token.startsWith('mock_token_admin_')) {
      return reply.send({
        user: {
          email: process.env.ADMIN_EMAIL || 'admin@plateflow.com',
          name: 'Administrador Gráfica',
          role: 'admin',
        },
      });
    }

    return reply.status(401).send({ error: 'Sessão inválida ou expirada.' });
  }
}
