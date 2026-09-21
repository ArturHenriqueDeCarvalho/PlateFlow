export interface AccessTokenClaims {
  sub: string;
  role: 'admin' | 'user';
  email: string;
  sid: string;
}

export interface ITokenIssuer {
  signAccess(claims: AccessTokenClaims, expiresAt: Date): Promise<string>;
}
