import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  let port =process.env.PORT ?? 3000
  await app.listen(port);
  console.log('listening on port',port)
}
await bootstrap();
