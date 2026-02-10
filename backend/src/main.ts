import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strips unknown properties
      forbidNonWhitelisted: true, // throws error on extra props
      transform: true,           // auto-transform DTOs
    }),
  );

  // Enable CORS (mobile + web later)
  app.enableCors();

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
