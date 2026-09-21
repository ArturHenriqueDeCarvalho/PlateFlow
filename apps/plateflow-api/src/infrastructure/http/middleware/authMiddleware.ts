import type { FastifyReply, FastifyRequest } from 'fastify';
import { DrizzleUserRepository } from '../../database/DrizzleUserRepository.js';
import { DrizzleRefreshSessionRepository } from '../../database/DrizzleRefreshSessionRepository.js';

const UNAUTHORIZED = {
  error: 'Não autorizado. Faça login como administrador para realizar alterações.',
};

const userRepo = new DrizzleUserRepository();
const refreshRepo = new DrizzleRefreshSessionRepository();

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify({ onlyCookie: true });
  } catch {
    return reply.status(401).send(UNAUTHORIZED);
  }

  const sub = req.user?.sub;
  if (!sub) {
    return reply.status(401).send(UNAUTHORIZED);
  }

  const sid = req.user?.sid;
  if (sid) {
    const session = await refreshRepo.findById(sid);
    if (!session || session.revokedAt || new Date() >= session.sessionExpiresAt) {
      return reply.status(401).send(UNAUTHORIZED);
    }
  }

  const user = await userRepo.findById(sub);
  if (!user || user.active === false) {
    return reply.status(401).send(UNAUTHORIZED);
  }

  req.authUser = {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: user.role,
  };
}
