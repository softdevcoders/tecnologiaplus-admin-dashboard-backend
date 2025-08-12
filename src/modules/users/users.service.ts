import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User, UserRole, UserStatus } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    status?: 'ACTIVE' | 'DEACTIVATED';
    search?: string;
  }): Promise<{ data: User[]; meta: any }> {
    const { page = 1, limit = 10, role, status, search } = params;

    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.articles', 'articles')
      .where('user.deletedAt IS NULL') // Excluir usuarios eliminados
      .orderBy('user.createdAt', 'DESC');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    if (search) {
      query.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [users, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
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

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, deletedAt: IsNull() }, // Excluir usuarios eliminados
      relations: ['articles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepo.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepo.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepo.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId?: string): Promise<User> {
    const user = await this.findOne(id);

    // Verificar que el usuario no se esté cambiando a sí mismo el rol de ADMIN a EDITOR
    if (currentUserId && currentUserId === id && user.role === UserRole.ADMIN && updateUserDto.role === UserRole.EDITOR) {
      throw new ConflictException('No puedes cambiar tu propio rol de Administrador a Editor por seguridad');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepo.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.userRepo.save(user);
  }

  async remove(id: string, currentUserId?: string): Promise<void> {
    const user = await this.findOne(id);

    // Verificar que el usuario no se esté eliminando a sí mismo
    if (currentUserId && currentUserId === id) {
      throw new ConflictException('No puedes eliminarte a ti mismo');
    }

    // Usar softDelete en lugar de softRemove para evitar problemas con relaciones
    await this.userRepo.softDelete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async updateStatus(id: string, status: UserStatus, currentUserId?: string): Promise<User> {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    // Verificar que el usuario no se esté desactivando a sí mismo
    if (currentUserId && currentUserId === id && status === UserStatus.DEACTIVATED) {
      throw new ConflictException('No puedes desactivarte a ti mismo');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    user.status = status;
    return this.userRepo.save(user);
  }
}
