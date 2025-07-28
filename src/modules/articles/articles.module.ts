import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesController } from '@/modules/articles/articles.controller';
import { ArticlesService } from '@/modules/articles/articles.service';
import { Article } from '@/modules/articles/article.entity';
import { Category } from '@/modules/categories/category.entity';
import { Tag } from '@/modules/tags/tag.entity';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category, Tag]), UsersModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
