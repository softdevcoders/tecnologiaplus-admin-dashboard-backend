import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesController } from './images.controller';
import { CloudinaryService } from '@/core/services/cloudinary.service';
import { TempImage } from '@/core/database/entities/temp-image.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([TempImage]), ConfigModule],
  controllers: [ImagesController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class ImagesModule {}
