import type { AuthUser } from '@plateflow/types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: 'admin' | 'user';
      email: string;
      sid: string;
    };
    user: {
      sub: string;
      role: 'admin' | 'user';
      email: string;
      sid: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
