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
