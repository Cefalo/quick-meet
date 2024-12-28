import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appPort: parseInt(process.env.APP_PORT) || 8080,
  environment: process.env.NODE_ENV || 'development',
  logsDir: process.env.LOGS_DIR || 'logs',
  encryptionKey: process.env.ENCRYPTION_KEY,
  jwtSecret: process.env.JWT_SECRET || 'secret',
  oAuthClientSecret: process.env.OAUTH_CLIENT_SECRET,
  oAuthClientId: process.env.OAUTH_CLIENT_ID,
  oAuthRedirectUrl: process.env.OAUTH_REDIRECT_URL,
}));
