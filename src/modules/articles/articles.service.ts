import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '@/modules/articles/article.entity';
import { User } from '@/modules/users/user.entity';
import { Category } from '@/modules/categories/category.entity';
import { Tag } from '@/modules/tags/tag.entity';
import { SortField, SortOrder } from '@/modules/articles/dto/article-query.dto';

interface CreateArticleData extends Partial<Article> {
  categoryId?: string;
  tagIds?: string[];
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepo: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
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
        '(article.title ILIKE :keyword OR article.content ILIKE :keyword OR article.summary ILIKE :keyword)',
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

  async create(data: CreateArticleData, author: User): Promise<Article> {
    // Buscar categoría si se proporciona categoryId
    let category: Category | undefined = undefined;
    if (data.categoryId) {
      const foundCategory = await this.categoryRepo.findOne({
        where: { id: data.categoryId },
      });
      category = foundCategory || undefined;
    }

    // Buscar tags si se proporcionan tagIds
    let tags: Tag[] = [];
    if (data.tagIds && data.tagIds.length > 0) {
      tags = await this.tagRepo.findByIds(data.tagIds);
    }

    // Mapear campos del DTO a la entidad
    const articleData = {
      title: data.title,
      content: data.content,
      slug: data.slug,
      summary: data.summary,
      metaTitle: data.metaTitle,
      metaKeywords: data.metaKeywords,
      metaDescription: data.metaDescription,
      coverImage: data.coverImage,
      images: data.images,
      isPublished: data.isPublished || false,
      author,
      category,
      tags,
    };

    const article = this.articleRepo.create(articleData);
    return this.articleRepo.save(article);
  }

  async update(id: string, data: CreateArticleData): Promise<Article> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');

    // Buscar categoría si se proporciona categoryId
    if (data.categoryId) {
      const foundCategory = await this.categoryRepo.findOne({
        where: { id: data.categoryId },
      });
      article.category = foundCategory || undefined;
    }

    // Buscar tags si se proporcionan tagIds
    if (data.tagIds && data.tagIds.length > 0) {
      const tags = await this.tagRepo.findByIds(data.tagIds);
      article.tags = tags;
    }

    // Mapear campos del DTO a la entidad
    const updateData = {
      title: data.title,
      content: data.content,
      slug: data.slug,
      summary: data.summary,
      metaTitle: data.metaTitle,
      metaKeywords: data.metaKeywords,
      metaDescription: data.metaDescription,
      coverImage: data.coverImage,
      images: data.images,
      isPublished: data.isPublished,
    };

    Object.assign(article, updateData);
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
