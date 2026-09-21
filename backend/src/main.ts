import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
app.use(cors({
  // Dynamically allow any origin that makes the request
  origin: function (origin, callback) {
    // If the request has no origin (like mobile apps, curl, or Postman), allow it
    if (!origin) return callback(null, true);
    
    // Express will mirror this exact origin back to the browser
    callback(null, true);
  },
  // Explicitly allow the browser to pass credentials
  credentials: true
}));
  let port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log('listening on port', port);
}
await bootstrap();
