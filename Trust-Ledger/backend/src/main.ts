import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function getAllowedOrigins() {
  const rawOrigins = process.env.CORS_ORIGINS;
  if (!rawOrigins) {
    return ['http://localhost:5173'];
  }

  return rawOrigins
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without origin (curl/postman) and known frontend origins.
      if (!origin || allowedOrigins.includes(origin)) {
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
