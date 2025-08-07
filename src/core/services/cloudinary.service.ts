import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import {
  CLOUDINARY_CONFIG,
  getCloudinaryFolder,
} from '../config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configurar Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Subir imagen sin transformaciones
   */
  async uploadImage(
    file: Express.Multer.File,
    folderType: keyof typeof CLOUDINARY_CONFIG.FOLDERS,
    sessionId?: string,
  ): Promise<{ url: string; publicId: string }> {
    try {
      // Convertir buffer a base64
      const base64Image = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${base64Image}`;

      // Generar ruta de carpeta usando la configuración centralizada
      const folder = getCloudinaryFolder(folderType, sessionId);

      // Subir a Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        resource_type: 'image',
        // Configuración para mantener calidad original
        quality: CLOUDINARY_CONFIG.UPLOAD.PRESERVE_QUALITY.quality,
        fetch_format: CLOUDINARY_CONFIG.UPLOAD.PRESERVE_QUALITY.fetch_format,
        flags: CLOUDINARY_CONFIG.UPLOAD.PRESERVE_QUALITY.flags,
        // SIN transformaciones de tamaño - subir tal como viene
        chunk_size: CLOUDINARY_CONFIG.UPLOAD.CHUNK_SIZE,
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Error al subir imagen a Cloudinary');
    }
  }

  /**
   * Subir imagen principal del artículo
   */
  async uploadCoverImage(
    file: Express.Multer.File,
    sessionId: string,
  ): Promise<{ url: string; publicId: string }> {
    return this.uploadImage(file, 'ARTICLES_COVERS', sessionId);
  }

  /**
   * Subir imagen de contenido del artículo
   */
  async uploadContentImage(
    file: Express.Multer.File,
    sessionId: string,
  ): Promise<{ url: string; publicId: string }> {
    return this.uploadImage(file, 'ARTICLES_CONTENT', sessionId);
  }

  /**
   * Eliminar imagen de Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw new Error('Error al eliminar imagen de Cloudinary');
    }
  }

  /**
   * Verificar si una imagen existe
   */
  async imageExists(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return !!result;
    } catch (error: any) {
      return false;
    }
  }
}
