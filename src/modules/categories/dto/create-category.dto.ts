import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Category name',
    example: 'Web Development',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'URL-friendly version of the name',
    example: 'web-development',
  })
  slug: string;

  @IsString()
  @ApiProperty({
    description: 'Category description',
    required: false,
    example: 'Articles about web development technologies and best practices',
  })
  description?: string;
}
