import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
  })
  name?: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email',
    required: false,
  })
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  @ApiProperty({
    description: 'User password - minimum 8 characters',
    example: 'securePass123',
    minLength: 8,
    required: false,
  })
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  @ApiProperty({
    description: 'User role - only admins can change this',
    enum: UserRole,
    example: UserRole.EDITOR,
    required: false,
  })
  role?: UserRole;
}
