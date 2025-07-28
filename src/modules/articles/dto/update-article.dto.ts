import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateArticleDto {
  @ApiProperty({
    description: 'Article title',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Article content in markdown format',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Short description of the article',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Keywords for SEO',
    required: false,
  })
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiProperty({
    description: 'URL of the cover image',
    required: false,
  })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiProperty({
    description: 'Whether the article is published',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @ApiProperty({
    description: 'Category ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: 'Array of tag IDs',
    required: false,
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
