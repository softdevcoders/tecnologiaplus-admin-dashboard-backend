import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard';
import { CloudinaryService } from '@/core/services/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TempImage } from '@/core/database/entities/temp-image.entity';
import { CLOUDINARY_CONFIG } from '@/core/config/cloudinary.config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@Controller('images')
@ApiTags('images')
export class ImagesController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(TempImage)
    private tempImageRepo: Repository<TempImage>,
  ) {}

  @Post('upload/cover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        sessionId: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Subir imagen principal del artículo',
    description:
      'Sube una imagen principal para un artículo en proceso de creación',
  })
  @ApiResponse({
    status: 201,
    description: 'Imagen subida exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        publicId: { type: 'string' },
        tempImageId: { type: 'string' },
      },
    },
  })
  async uploadCoverImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!sessionId) {
      throw new BadRequestException('SessionId es requerido');
    }

    // Validar tamaño usando configuración centralizada
    if (file.size > CLOUDINARY_CONFIG.UPLOAD.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Máximo ${CLOUDINARY_CONFIG.UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Validar tipo de archivo usando configuración centralizada
    if (
      !CLOUDINARY_CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.mimetype as any)
    ) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    try {
      // Subir a Cloudinary
      const result = await this.cloudinaryService.uploadCoverImage(file);

      // Guardar en tabla temporal
      const tempImage = this.tempImageRepo.create({
        sessionId,
        cloudinaryUrl: result.url,
        cloudinaryPublicId: result.publicId,
        type: 'cover',
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      });

      await this.tempImageRepo.save(tempImage);

      return {
        url: result.url,
        publicId: result.publicId,
        tempImageId: tempImage.id,
      };
    } catch (error) {
      console.error('Error uploading cover image:', error);
      throw new BadRequestException('Error al subir la imagen');
    }
  }

  @Post('upload/content')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        sessionId: {
          type: 'string',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Subir imagen de contenido del artículo',
    description:
      'Sube una imagen para el contenido de un artículo en proceso de creación',
  })
  @ApiResponse({
    status: 201,
    description: 'Imagen subida exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        publicId: { type: 'string' },
        tempImageId: { type: 'string' },
      },
    },
  })
  async uploadContentImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!sessionId) {
      throw new BadRequestException('SessionId es requerido');
    }

    // Validar tamaño usando configuración centralizada
    if (file.size > CLOUDINARY_CONFIG.UPLOAD.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `El archivo es demasiado grande. Máximo ${CLOUDINARY_CONFIG.UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Validar tipo de archivo usando configuración centralizada
    if (
      !CLOUDINARY_CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.mimetype as any)
    ) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    try {
      // Subir a Cloudinary
      const result = await this.cloudinaryService.uploadContentImage(file);

      // Guardar en tabla temporal
      const tempImage = this.tempImageRepo.create({
        sessionId,
        cloudinaryUrl: result.url,
        cloudinaryPublicId: result.publicId,
        type: 'content',
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      });

      await this.tempImageRepo.save(tempImage);

      return {
        url: result.url,
        publicId: result.publicId,
        tempImageId: tempImage.id,
      };
    } catch (error) {
      console.error('Error uploading content image:', error);
      throw new BadRequestException('Error al subir la imagen');
    }
  }

  @Post('move-to-article')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mover imágenes temporales a ubicación final del artículo',
    description:
      'Mueve las imágenes temporales a la estructura final organizada por categoría y artículo',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tempImageIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs de las imágenes temporales a mover',
        },
        categorySlug: {
          type: 'string',
          description: 'Slug de la categoría del artículo',
        },
        articleSlug: {
          type: 'string',
          description: 'Slug del artículo',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Imágenes movidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        movedImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tempImageId: { type: 'string' },
              newUrl: { type: 'string' },
              newPublicId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async moveImagesToArticle(
    @Body()
    body: {
      tempImageIds: string[];
      categorySlug: string;
      articleSlug: string;
    },
  ) {
    const { tempImageIds, categorySlug, articleSlug } = body;

    if (!tempImageIds || tempImageIds.length === 0) {
      throw new BadRequestException(
        'No se proporcionaron IDs de imágenes temporales',
      );
    }

    if (!categorySlug || !articleSlug) {
      throw new BadRequestException(
        'CategorySlug y ArticleSlug son requeridos',
      );
    }

    try {
      const movedImages: {
        tempImageId: string;
        newUrl: string;
        newPublicId: string;
      }[] = [];

      for (const tempImageId of tempImageIds) {
        const tempImage = await this.tempImageRepo.findOne({
          where: { id: tempImageId },
        });

        if (!tempImage) {
          console.warn(`Imagen temporal no encontrada: ${tempImageId}`);
          continue;
        }

        // Generar el nuevo nombre de archivo
        const fileExtension = tempImage.fileName.split('.').pop() || 'jpg';
        const newFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

        // Construir la nueva ruta
        const newFolder = `tecnologiaplus/articles/${categorySlug}/${articleSlug}`;
        const newPublicId = `${newFolder}/${newFileName}`;

        // Mover la imagen en Cloudinary
        const result = await this.cloudinaryService.moveImage(
          tempImage.cloudinaryPublicId,
          newPublicId,
        );

        if (result) {
          // Actualizar la imagen temporal como usada
          tempImage.isUsed = true;
          tempImage.newUrl = result.url;
          tempImage.newPublicId = result.publicId;
          await this.tempImageRepo.save(tempImage);

          movedImages.push({
            tempImageId,
            newUrl: result.url,
            newPublicId: result.publicId,
          });
        }
      }

      return { movedImages };
    } catch (error) {
      console.error('Error moving images to article:', error);
      throw new BadRequestException('Error al mover las imágenes al artículo');
    }
  }

  @Delete('temp/:tempImageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar imagen temporal',
    description: 'Elimina una imagen temporal y la borra de Cloudinary',
  })
  @ApiResponse({
    status: 200,
    description: 'Imagen eliminada exitosamente',
  })
  async deleteTempImage(@Param('tempImageId') tempImageId: string) {
    const tempImage = await this.tempImageRepo.findOne({
      where: { id: tempImageId },
    });

    if (!tempImage) {
      throw new NotFoundException('Imagen temporal no encontrada');
    }

    try {
      // Eliminar de Cloudinary
      await this.cloudinaryService.deleteImage(tempImage.cloudinaryPublicId);

      // Eliminar de base de datos
      await this.tempImageRepo.delete(tempImageId);

      return { message: 'Imagen eliminada exitosamente' };
    } catch (error) {
      console.error('Error deleting temp image:', error);
      throw new BadRequestException('Error al eliminar la imagen');
    }
  }

  @Delete('cleanup/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Limpiar imágenes temporales de una sesión',
    description:
      'Elimina todas las imágenes temporales de una sesión específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Imágenes temporales eliminadas exitosamente',
  })
  async cleanupSessionImages(@Param('sessionId') sessionId: string) {
    const tempImages = await this.tempImageRepo.find({
      where: { sessionId, isUsed: false },
    });

    for (const tempImage of tempImages) {
      try {
        // Eliminar de Cloudinary
        await this.cloudinaryService.deleteImage(tempImage.cloudinaryPublicId);
      } catch (error) {
        console.error(
          `Error deleting image ${tempImage.cloudinaryPublicId}:`,
          error,
        );
      }
    }

    // Eliminar de base de datos
    await this.tempImageRepo.delete({
      sessionId,
      isUsed: false,
    });

    return {
      message: `${tempImages.length} imágenes temporales eliminadas`,
      deletedCount: tempImages.length,
    };
  }
}
