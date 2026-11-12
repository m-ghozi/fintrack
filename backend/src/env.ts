/**
 * Loads backend/.env into process.env before any other module is imported.
 *
 * WHY: JwtModule.register({ secret: process.env.JWT_SECRET ?? ... }) in
 * auth.module.ts is evaluated at REQUIRE time (when this module graph is
 * first loaded), which happens before Nest's ConfigModule.forRoot() reads
 * .env during bootstrap. Without this early load, tokens were signed with the
 * fallback 'dev-secret-change-me' while JwtStrategy verified with the real
 * secret from .env, so every authenticated request returned 401 and the
 * frontend bounced users back to /login.
 *
 * The path is resolved relative to this file (not cwd) so it works whether
 * the server is started from the repo root or from backend/.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// __dirname points to backend/src (tsc) or backend/dist (nest build).
config({ path: resolve(__dirname, '../.env') });

// Fail fast in production instead of silently signing JWTs with the
// 'dev-secret-change-me' fallback (which would invalidate every token issued
// by JwtStrategy using the real secret, or worse, be trivially forgeable).
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET must be set when NODE_ENV=production');
  process.exit(1);
}
