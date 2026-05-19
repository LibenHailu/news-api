import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MongooseExceptionFilter } from './common/filters/mongoose-exception.filter';
import { ResponseInterceptor } from './common/intercepters/response';
import { SanitizeInterceptor } from './common/filters/sanitizer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  // Sanitize runs on handler output first; Response wraps it ({ success, data }).
  app.useGlobalInterceptors(
    new ResponseInterceptor(),
    new SanitizeInterceptor(),
  );
  app.useGlobalFilters(new MongooseExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
