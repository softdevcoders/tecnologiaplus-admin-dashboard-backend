import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Request,
  UseGuards,
  Patch,
  Query,
} from '@nestjs/common';
import { ArticlesService } from '@/modules/articles/articles.service';
import { Article } from '@/modules/articles/article.entity';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { User, UserRole } from '@/modules/users/user.entity';
import { UsersService } from '@/modules/users/users.service';
import { RolesGuard } from '@/modules/auth/roles.guard';
import { ArticleQueryDto } from '@/modules/articles/dto/article-query.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateArticleDto } from '@/modules/articles/dto/create-article.dto';
import { Roles } from '@/modules/auth/roles.decorator';

@Controller('articles')
@ApiTags('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all articles',
    description: 'Retrieve all articles with pagination and filtering options',
  })
  @ApiResponse({
    status: 200,
    description: 'Articles retrieved successfully',
  })
  async findAll(@Query() query: ArticleQueryDto) {
    return this.articlesService.findAll({
      categoryId: query.category,
      tagId: query.tag,
      authorId: query.author,
      isPublished: query.published,
      page: query.page,
      limit: query.limit,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
    });
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search articles',
    description: 'Search articles by title, content, or description',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  async search(@Query() query: ArticleQueryDto) {
    return this.articlesService.findAll({
      categoryId: query.category,
      tagId: query.tag,
      authorId: query.author,
      isPublished: query.published,
      page: query.page,
      limit: query.limit,
      sortField: query.sortField,
      sortOrder: query.sortOrder,
    });
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get article by slug',
    description:
      'Retrieve a specific article by its slug with all its relationships (author, category, tags) and metadata.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Article slug',
    example: 'introduction-to-nestjs',
  })
  @ApiResponse({
    status: 200,
    description: 'Article found',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to NestJS',
          content:
            '# Getting Started with NestJS\n\nNestJS is a progressive Node.js framework...',
          slug: 'introduction-to-nestjs',
          description: 'Learn the basics of NestJS framework',
          keywords: 'nestjs, nodejs, typescript, backend',
          coverImage: 'https://example.com/images/nestjs-cover.jpg',
          isPublished: true,
          author: {
            id: '987fcdeb-51d3-a456-b789-012345678901',
            name: 'John Doe',
            email: 'john@example.com',
          },
          category: {
            id: 'abc12345-e89b-12d3-a456-426614174000',
            name: 'Backend Development',
            slug: 'backend-development',
          },
          tags: [
            { id: 'tag123', name: 'NestJS', slug: 'nestjs' },
            { id: 'tag456', name: 'TypeScript', slug: 'typescript' },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  findBySlug(@Param('slug') slug: string): Promise<Article> {
    return this.articlesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get article by ID',
    description:
      'Retrieve a specific article by its ID with all its relationships (author, category, tags) and metadata.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Article found',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to NestJS',
          content:
            '# Getting Started with NestJS\n\nNestJS is a progressive Node.js framework...',
          slug: 'introduction-to-nestjs',
          description: 'Learn the basics of NestJS framework',
          keywords: 'nestjs, nodejs, typescript, backend',
          coverImage: 'https://example.com/images/nestjs-cover.jpg',
          isPublished: true,
          author: {
            id: '987fcdeb-51d3-a456-b789-012345678901',
            name: 'John Doe',
            email: 'john@example.com',
          },
          category: {
            id: 'abc12345-e89b-12d3-a456-426614174000',
            name: 'Backend Development',
            slug: 'backend-development',
          },
          tags: [
            { id: 'tag123', name: 'NestJS', slug: 'nestjs' },
            { id: 'tag456', name: 'TypeScript', slug: 'typescript' },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  findOne(@Param('id') id: string): Promise<Article> {
    return this.articlesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new article',
    description:
      'Create a new article. The author will be set automatically based on the authenticated user.',
  })
  @ApiBody({
    type: CreateArticleDto,
    examples: {
      draft: {
        value: {
          title: 'Introduction to NestJS',
          content:
            '# Getting Started with NestJS\n\nNestJS is a progressive Node.js framework...',
          description: 'Learn the basics of NestJS framework',
          keywords: 'nestjs, nodejs, typescript, backend',
          categoryId: 'abc12345-e89b-12d3-a456-426614174000',
          tagIds: ['tag123', 'tag456'],
          isPublished: false,
        },
        summary: 'Create draft article',
      },
      published: {
        value: {
          title: 'Advanced TypeScript Features',
          content: '# TypeScript Advanced Types\n\nIn this article...',
          slug: 'advanced-typescript-features',
          description: 'Deep dive into TypeScript advanced types and features',
          keywords: 'typescript, advanced types, generics, decorators',
          coverImage: 'https://example.com/images/typescript-cover.jpg',
          categoryId: 'def67890-e89b-12d3-a456-426614174000',
          tagIds: ['tag456', 'tag789'],
          isPublished: true,
        },
        summary: 'Create published article',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Article created successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to NestJS',
          content:
            '# Getting Started with NestJS\n\nNestJS is a progressive Node.js framework...',
          slug: 'introduction-to-nestjs',
          description: 'Learn the basics of NestJS framework',
          keywords: 'nestjs, nodejs, typescript, backend',
          isPublished: false,
          author: {
            id: '987fcdeb-51d3-a456-b789-012345678901',
            name: 'John Doe',
            email: 'john@example.com',
          },
          category: {
            id: 'abc12345-e89b-12d3-a456-426614174000',
            name: 'Backend Development',
            slug: 'backend-development',
          },
          tags: [
            { id: 'tag123', name: 'NestJS', slug: 'nestjs' },
            { id: 'tag456', name: 'TypeScript', slug: 'typescript' },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async create(
    @Body() data: CreateArticleDto,
    @Request() req: { user: { userId: string; email: string; role: UserRole } },
  ): Promise<Article> {
    const user = await this.usersService.findOne(req.user.userId);
    return this.articlesService.create(data, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update article',
    description:
      'Update an existing article. Only the author or an admin can update the article.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: CreateArticleDto,
    examples: {
      updateContent: {
        value: {
          title: 'Updated: Introduction to NestJS',
          content:
            '# Getting Started with NestJS - Updated\n\nNestJS is a progressive Node.js framework...',
          description: 'Updated guide to NestJS basics',
          keywords: 'nestjs, nodejs, typescript, backend, updated',
          categoryId: 'abc12345-e89b-12d3-a456-426614174000',
          tagIds: ['tag123', 'tag456', 'tag789'],
        },
        summary: 'Update article content',
      },
      changeCategory: {
        value: {
          categoryId: 'def67890-e89b-12d3-a456-426614174000',
          tagIds: ['tag456', 'tag789'],
        },
        summary: 'Change article category and tags',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Article updated successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Updated: Introduction to NestJS',
          content:
            '# Getting Started with NestJS - Updated\n\nNestJS is a progressive Node.js framework...',
          slug: 'updated-introduction-to-nestjs',
          description: 'Updated guide to NestJS basics',
          keywords: 'nestjs, nodejs, typescript, backend, updated',
          isPublished: true,
          author: {
            id: '987fcdeb-51d3-a456-b789-012345678901',
            name: 'John Doe',
          },
          category: {
            id: 'abc12345-e89b-12d3-a456-426614174000',
            name: 'Backend Development',
            slug: 'backend-development',
          },
          tags: [
            { id: 'tag123', name: 'NestJS', slug: 'nestjs' },
            { id: 'tag456', name: 'TypeScript', slug: 'typescript' },
            { id: 'tag789', name: 'Web Development', slug: 'web-development' },
          ],
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the author or admin',
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  update(
    @Param('id') id: string,
    @Body() data: CreateArticleDto,
  ): Promise<Article> {
    return this.articlesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar artículo',
    description:
      'Eliminar un artículo (soft delete). Solo administradores o el autor del artículo pueden eliminarlo. El artículo será ocultado pero permanecerá en la base de datos.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Artículo eliminado exitosamente',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to NestJS',
          isDeleted: true,
          deletedAt: '2024-01-03T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - user is not admin or article author' 
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: { userId: string; email: string; role: UserRole } },
  ): Promise<void> {
    const user = await this.usersService.findOne(req.user.userId);
    return this.articlesService.remove(id, user);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publicar artículo',
    description:
      'Publicar un artículo para que sea visible para todos los usuarios. Solo admins y editores pueden realizar esta acción.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Artículo publicado exitosamente',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to NestJS',
          slug: 'introduction-to-nestjs',
          isPublished: true,
          author: {
            id: '987fcdeb-51d3-a456-b789-012345678901',
            name: 'John Doe',
          },
          category: {
            id: 'abc12345-e89b-12d3-a456-426614174000',
            name: 'Backend Development',
          },
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin or editor role',
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async publish(@Param('id') id: string): Promise<Article> {
    return this.articlesService.publish(id);
  }

  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retirar artículo',
    description:
      'Retirar un artículo para que ya no sea visible para los usuarios. Solo admins y editores pueden realizar esta acción.',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Artículo retirado exitosamente',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Introduction to NestJS',
          slug: 'introduction-to-nestjs',
          isPublished: false,
          author: {
            id: '987fcdeb-51d3-a456-b789-012345678901',
            name: 'John Doe',
          },
          category: {
            id: 'abc12345-e89b-12d3-a456-426614174000',
            name: 'Backend Development',
          },
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires admin or editor role',
  })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async unpublish(@Param('id') id: string): Promise<Article> {
    return this.articlesService.unpublish(id);
  }
}
