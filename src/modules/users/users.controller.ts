import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole, UserStatus } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Retrieve a list of all users with pagination and filtering options. Only accessible by administrators.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts from 1)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter by user role',
    enum: UserRole,
    example: UserRole.EDITOR,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by user status',
    enum: ['ACTIVE', 'DEACTIVATED'],
    example: 'ACTIVE',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
    type: String,
    example: 'john',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    content: {
      'application/json': {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'John Doe',
              email: 'john@example.com',
              role: UserRole.EDITOR,
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
              name: 'Admin User',
              email: 'admin@example.com',
              role: UserRole.ADMIN,
              articles: [],
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            totalItems: 50,
            totalPages: 5,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
    @Query('status') status?: 'ACTIVE' | 'DEACTIVATED',
    @Query('search') search?: string,
  ): Promise<{ data: User[]; meta: any }> {
    return this.usersService.findAll({
      page,
      limit,
      role,
      status,
      search,
    });
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Retrieve a specific user by their ID with their articles. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.EDITOR,
          articles: [
            {
              id: 'article123',
              title: 'Introduction to NestJS',
              slug: 'introduction-to-nestjs',
              isPublished: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-02T00:00:00Z',
            },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create new user',
    description:
      'Create a new user account. Only accessible by administrators.',
  })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      editor: {
        value: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'securePass123',
          role: UserRole.EDITOR,
        },
        summary: 'Create editor user',
      },
      admin: {
        value: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'adminPass123',
          role: UserRole.ADMIN,
        },
        summary: 'Create admin user',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.EDITOR,
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
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user',
    description:
      'Update an existing user account. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      updateRole: {
        value: {
          role: UserRole.ADMIN,
        },
        summary: 'Update user role',
      },
      updateProfile: {
        value: {
          name: 'John Smith',
          email: 'john.smith@example.com',
        },
        summary: 'Update user profile',
      },
      updatePassword: {
        value: {
          password: 'newSecurePass123',
        },
        summary: 'Update user password',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Smith',
          email: 'john.smith@example.com',
          role: UserRole.ADMIN,
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
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - email already exists or cannot change own role from admin to editor',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: Request & { user: { id: string } },
  ): Promise<User> {
    const currentUserId = req.user?.id;
    return this.usersService.update(id, updateUserDto, currentUserId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user status',
    description:
      'Update user status to ACTIVE or DEACTIVATED. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ACTIVE', 'DEACTIVATED'],
          example: 'DEACTIVATED',
        },
        reason: {
          type: 'string',
          description: 'Optional reason for status change',
          example: 'User requested deactivation',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          status: 'DEACTIVATED',
          updatedAt: '2024-01-03T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: UserStatus; reason?: string },
    @Request() req: Request & { user: { id: string } },
  ): Promise<User> {
    const currentUserId = req.user?.id;
    return await this.usersService.updateStatus(id, body.status, currentUserId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete user',
    description:
      'Delete a user account. Only accessible by administrators. This will also delete all articles created by the user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John Doe',
          deletedAt: '2024-01-03T00:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: Request & { user: { id: string } },
  ): Promise<void> {
    const currentUserId = req.user?.id;
    return await this.usersService.remove(id, currentUserId);
  }
}
