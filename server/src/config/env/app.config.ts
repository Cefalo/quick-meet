import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appPort: parseInt(process.env.APP_PORT) || 8080,
  environment: process.env.NODE_ENV || 'development',
  logsDir: process.env.LOGS_DIR || 'logs',
  appDomain: process.env.APP_DOMAIN || 'http://localhost:8000',
  encryptionKey: process.env.ENCRYPTION_KEY,

  jwtSecret: process.env.JWT_SECRET || 'ZZZ',

  oAuthClientSecret: process.env.OAUTH_CLIENT_SECRET,
  oAuthClientId: process.env.OAUTH_CLIENT_ID,
  mockCalender: process.env.MOCK_CALENDER,
}));
