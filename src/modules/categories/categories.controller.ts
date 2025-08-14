import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Category } from './category.entity';

@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description:
      'Retrieve a list of all categories with their associated articles.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories retrieved successfully',
    type: [Category],
    content: {
      'application/json': {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Backend Development',
            slug: 'backend-development',
            description:
              'Articles about backend development technologies and practices',
            articles: [
              {
                id: 'article123',
                title: 'Introduction to NestJS',
                slug: 'introduction-to-nestjs',
                isPublished: true,
              },
            ],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
          {
            id: '987fcdeb-51d3-a456-b789-012345678901',
            name: 'Frontend Development',
            slug: 'frontend-development',
            description: 'Articles about frontend frameworks and UI/UX',
            articles: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
      },
    },
  })
  async findAll(@Request() req: { user?: { role: UserRole } }) {
    const include = req.user?.role === UserRole.ADMIN;
    return this.service.findAll(include);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description:
      'Retrieve a specific category by its ID with associated articles.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Category found',
    type: Category,
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Backend Development',
          slug: 'backend-development',
          description:
            'Articles about backend development technologies and practices',
          articles: [
            {
              id: 'article123',
              title: 'Introduction to NestJS',
              slug: 'introduction-to-nestjs',
              isPublished: true,
              author: {
                id: 'user123',
                name: 'John Doe',
              },
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new category',
    description: 'Create a new category. Only accessible by administrators.',
  })
  @ApiBody({
    type: CreateCategoryDto,
    examples: {
      basic: {
        value: {
          name: 'Backend Development',
          description:
            'Articles about backend development technologies and practices',
        },
        summary: 'Create basic category',
      },
      withSlug: {
        value: {
          name: 'Frontend Development',
          slug: 'frontend-development',
          description: 'Articles about frontend frameworks and UI/UX',
        },
        summary: 'Create category with custom slug',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: Category,
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Backend Development',
          slug: 'backend-development',
          description:
            'Articles about backend development technologies and practices',
          articles: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update category',
    description:
      'Update an existing category. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: Category,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete category',
    description:
      'Remove a category. Only accessible by administrators. Cannot delete categories with associated articles.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID to delete',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - category has associated articles',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
