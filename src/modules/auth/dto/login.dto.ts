import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    description: 'User password - minimum 8 characters',
    example: 'password123',
    minLength: 8,
  })
  password: string;
}
