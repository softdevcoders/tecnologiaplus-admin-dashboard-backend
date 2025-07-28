import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
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
import { Tag } from './tag.entity';

@Controller('tags')
@UseGuards(JwtAuthGuard)
@ApiTags('tags')
@ApiBearerAuth()
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all tags',
    description: 'Retrieve a list of all tags with their associated articles.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tags retrieved successfully',
    type: [Tag],
    content: {
      'application/json': {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'NestJS',
            slug: 'nestjs',
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
            name: 'TypeScript',
            slug: 'typescript',
            articles: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
      },
    },
  })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get tag by ID',
    description: 'Retrieve a specific tag by its ID with associated articles.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tag ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tag found',
    type: Tag,
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'NestJS',
          slug: 'nestjs',
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
  @ApiResponse({ status: 404, description: 'Tag not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new tag',
    description: 'Create a new tag. Only accessible by administrators.',
  })
  @ApiBody({
    type: CreateTagDto,
    examples: {
      basic: {
        value: {
          name: 'NestJS',
        },
        summary: 'Create basic tag',
      },
      withSlug: {
        value: {
          name: 'TypeScript',
          slug: 'typescript',
        },
        summary: 'Create tag with custom slug',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tag created successfully',
    type: Tag,
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'NestJS',
          slug: 'nestjs',
          articles: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  create(@Body() dto: CreateTagDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update tag',
    description: 'Update an existing tag. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tag ID to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({
    status: 200,
    description: 'Tag updated successfully',
    type: Tag,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete tag',
    description:
      'Remove a tag. Only accessible by administrators. Cannot delete tags with associated articles.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tag ID to delete',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tag deleted successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - tag has associated articles',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
