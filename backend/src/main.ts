import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser — debe ir antes de cualquier guard o middleware
  // que necesite leer cookies
  app.use(cookieParser());

  // Security headers (Helmet)
  app.use(helmet());

  // CORS — origin como función para manejar credentials correctamente
  // Con credentials:true, el browser rechaza wildcard '*', necesita
  // origin explícito que coincida exactamente con el request origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [
    'http://localhost:5173', // Vite (React dev server)
    'http://localhost:3001', // React alternativo
    'http://localhost:8080', // Flutter web
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true, // Permite envío de cookies cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();