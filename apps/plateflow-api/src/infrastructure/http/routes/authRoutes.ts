import type { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/authMiddleware.js';
import { AuthController } from '../controllers/AuthController.js';
import { DrizzleUserRepository } from '../../database/DrizzleUserRepository.js';
import { DrizzleRefreshSessionRepository } from '../../database/DrizzleRefreshSessionRepository.js';
import { ScryptPasswordHasher } from '../../crypto/ScryptPasswordHasher.js';
import { FastifyTokenIssuer } from '../../auth/FastifyTokenIssuer.js';
import { LoginUseCase } from '../../../core/use-cases/auth/LoginUseCase.js';

const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 1 },
  },
} as const;

export const authRoutes: FastifyPluginAsync = async (app) => {
  const userRepo = new DrizzleUserRepository();
  const refreshRepo = new DrizzleRefreshSessionRepository();
  const hasher = new ScryptPasswordHasher();
  const controller = new AuthController(
    new LoginUseCase(userRepo, hasher, refreshRepo),
    new FastifyTokenIssuer(app),
  );

  app.post(
    '/login',
    { schema: { body: loginBodySchema } },
    (req: any, reply) => controller.login(req, reply),
  );
  app.get('/me', { preHandler: [requireAuth] }, (req, reply) => controller.me(req, reply));
};
