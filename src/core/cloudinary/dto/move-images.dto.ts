import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveImagesDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Array of image URLs or public IDs to move',
    example: [
      'blog/temp/image1',
      'https://res.cloudinary.com/mycloud/image/upload/blog/temp/image2.jpg',
    ],
    type: [String],
  })
  images: string[];

  @IsString()
  @ApiProperty({
    description: 'Target folder where the images will be moved to',
    example: 'blog/published',
    type: String,
  })
  targetFolder: string;
}
