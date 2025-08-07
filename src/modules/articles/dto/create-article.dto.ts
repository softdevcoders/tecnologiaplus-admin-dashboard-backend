import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @IsString()
  @ApiProperty({
    description: 'Article title',
    example: 'Introduction to NestJS',
  })
  title: string;

  @IsString()
  @ApiProperty({
    description: 'Article content in markdown format',
    example: '# Introduction\n\nNestJS is a progressive Node.js framework...',
  })
  content: string;

  @IsString()
  @ApiProperty({
    description: 'URL-friendly version of the title',
    example: 'introduction-to-nestjs',
  })
  slug: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Brief description of the article',
    required: false,
    example: 'Learn the basics of NestJS framework and its core concepts',
  })
  summary?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'SEO meta title for the article',
    required: false,
    example: 'Introduction to NestJS - Complete Guide for Beginners',
  })
  metaTitle?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'SEO keywords',
    required: false,
    example: 'nestjs, nodejs, typescript, web development',
  })
  metaKeywords?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'SEO meta description for the article',
    required: false,
    example:
      'Learn the basics of NestJS framework and its core concepts. Complete guide for beginners.',
  })
  metaDescription?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'URL of the article cover image',
    required: false,
    example: 'https://example.com/images/nestjs-cover.jpg',
  })
  coverImage?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Alt text for the article cover image',
    required: false,
    example: 'Imagen principal del artículo sobre NestJS',
  })
  coverImageAlt?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'JSON string containing URLs of images used in the article',
    required: false,
    example:
      '["https://example.com/images/diagram1.png", "https://example.com/images/screenshot2.jpg"]',
  })
  images?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Whether the article should be published immediately',
    required: false,
    default: false,
  })
  isPublished?: boolean;

  @IsUUID()
  @IsOptional()
  @ApiProperty({
    description: 'Category ID for the article',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Array of tag IDs to associate with the article',
    required: false,
    type: [String],
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '987fcdeb-51d3-a456-b789-012345678901',
    ],
  })
  tagIds?: string[];
}
