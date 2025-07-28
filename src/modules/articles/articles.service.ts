import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '@/modules/articles/article.entity';
import { User } from '@/modules/users/user.entity';
import { SortField, SortOrder } from '@/modules/articles/dto/article-query.dto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    tagId?: string;
    authorId?: string;
    isPublished?: boolean;
    includeDeleted?: boolean;
    sortField?: SortField;
    sortOrder?: SortOrder;
  }): Promise<{ data: Article[]; meta: any }> {
    const {
      page = 1,
      limit = 10,
      categoryId,
      tagId,
      authorId,
      isPublished,
      includeDeleted = false,
      sortField = SortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = params;

    const query = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags');

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    if (tagId) {
      query.andWhere('tags.id = :tagId', { tagId });
    }

    if (authorId) {
      query.andWhere('author.id = :authorId', { authorId });
    }

    if (typeof isPublished === 'boolean') {
      query.andWhere('article.isPublished = :isPublished', { isPublished });
    }

    if (!includeDeleted) {
      query.andWhere('article.deletedAt IS NULL');
    }

    query.orderBy(`article.${sortField}`, sortOrder);

    const [articles, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async search(params: {
    keyword?: string;
    tagIds?: string[];
    categoryId?: string;
    published?: boolean;
    includeDeleted?: boolean;
    page?: number;
    size?: number;
    sortBy?: SortField;
    sortOrder?: SortOrder;
  }): Promise<{ items: Article[]; meta: any }> {
    const {
      keyword,
      tagIds,
      categoryId,
      published,
      includeDeleted = false,
      page = 1,
      size = 10,
      sortBy = SortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = params;

    const query = this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags');

    if (!includeDeleted) {
      query.where('article.isDeleted = :isDeleted', { isDeleted: false });
    }

    if (keyword) {
      query.andWhere(
        '(article.title ILIKE :keyword OR article.content ILIKE :keyword OR article.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    if (tagIds && tagIds.length > 0) {
      query.andWhere('tags.id IN (:...tagIds)', { tagIds });
    }

    if (typeof published === 'boolean') {
      query.andWhere('article.isPublished = :published', { published });
    }

    query.orderBy(`article.${sortBy}`, sortOrder);

    const [items, total] = await query
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    const totalPages = Math.ceil(total / size);

    return {
      items,
      meta: {
        total,
        page,
        size,
        pages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async create(data: Partial<Article>, author: User): Promise<Article> {
    const article = this.articleRepo.create({ ...data, author });
    return this.articleRepo.save(article);
  }

  async update(id: string, data: Partial<Article>): Promise<Article> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    Object.assign(article, data);
    return this.articleRepo.save(article);
  }

  async remove(id: string): Promise<void> {
    await this.articleRepo.softDelete(id);
  }

  async togglePublish(id: string): Promise<Article> {
    const article = await this.findOne(id);
    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }
    article.isPublished = !article.isPublished;
    return this.articleRepo.save(article);
  }
}
