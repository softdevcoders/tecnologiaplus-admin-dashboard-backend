import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsString()
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    description: 'User password - minimum 8 characters',
    example: 'securePass123',
    minLength: 8,
  })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  @ApiProperty({
    description: 'User role - defaults to EDITOR if not specified',
    enum: UserRole,
    default: UserRole.EDITOR,
    example: UserRole.EDITOR,
  })
  role?: UserRole;
}
