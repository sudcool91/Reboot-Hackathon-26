import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function getAllowedOrigins() {
  const rawOrigins = process.env.CORS_ORIGINS;
  const fallbackOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  if (!rawOrigins) {
    return fallbackOrigins;
  }

  return rawOrigins
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .concat(fallbackOrigins);
}

function isAllowedOrigin(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const parsedOrigin = new URL(origin);
    const hostname = parsedOrigin.hostname;
    const isLocalDevHost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
    const isLocalNetworkHost = hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');

    return isLocalDevHost || isLocalNetworkHost;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
