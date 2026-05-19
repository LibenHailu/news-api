import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MongooseExceptionFilter } from './common/filters/mongoose-exception.filter';
import { ResponseInterceptor } from './common/intercepters/response';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new MongooseExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
