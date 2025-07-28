import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ArticleQueryDto {
  @ApiProperty({
    description: 'Category ID to filter articles',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Tag ID to filter articles',
    required: false,
  })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiProperty({
    description: 'Author ID to filter articles',
    required: false,
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({
    description: 'Filter by published status',
    required: false,
    type: Boolean,
  })
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsOptional()
  published?: boolean;

  @ApiProperty({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
    required: false,
    type: Number,
  })
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
    type: Number,
  })
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Field to sort by',
    enum: SortField,
    default: SortField.CREATED_AT,
    required: false,
  })
  @IsOptional()
  sortField?: SortField = SortField.CREATED_AT;

  @ApiProperty({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
    required: false,
  })
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
