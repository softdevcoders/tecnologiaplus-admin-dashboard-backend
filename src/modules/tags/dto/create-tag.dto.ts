import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tag name',
    example: 'JavaScript',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'URL-friendly version of the name',
    example: 'javascript',
  })
  slug: string;
}
