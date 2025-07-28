import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly cfg: ConfigService) {
    cloudinary.config({
      cloud_name: this.cfg.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.cfg.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.cfg.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  generateSignature(folder = 'blog') {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      this.cfg.get<string>('CLOUDINARY_API_SECRET') ?? '',
    );
    return { timestamp, signature, folder };
  }

  async delete(publicId: string) {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  }

  /** Extrae public_id de una URL completa o devuelve el id si ya lo es */
  private extractPublicId(input: string): string {
    if (!input.includes('://')) return input; // ya es publicId
    const parts = input.split('/upload/');
    return parts[1]?.split('.')[0] ?? input;
  }

  async moveImages(urls: string[], targetFolder: string): Promise<string[]> {
    const results: string[] = [];
    for (const url of urls) {
      const oldId = this.extractPublicId(url);
      const fileName = oldId.split('/').pop() ?? oldId;
      const newId = `${targetFolder}/${fileName}`;

      await cloudinary.uploader.rename(oldId, newId, { overwrite: true });
      results.push(newId);
    }
    return results;
  }
}
