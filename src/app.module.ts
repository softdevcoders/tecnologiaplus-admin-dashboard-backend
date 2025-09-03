import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { I18nModule, HeaderResolver, I18nJsonLoader } from 'nestjs-i18n';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { CloudinaryModule } from './core/cloudinary/cloudinary.module';
import { ImagesModule } from './modules/images/images.module';
import { HealthModule } from './core/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(
          process.cwd(),
          process.env.NODE_ENV === 'production'
            ? 'dist/core/i18n'
            : 'src/core/i18n',
        ),
        watch: process.env.NODE_ENV !== 'production',
      },
      loader: I18nJsonLoader,
      resolvers: [new HeaderResolver(['x-lang', 'accept-language'])],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'blog',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ArticlesModule,
    CategoriesModule,
    TagsModule,
    CloudinaryModule,
    ImagesModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
