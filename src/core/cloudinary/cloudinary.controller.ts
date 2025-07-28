import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { MoveImagesDto } from '@/core/cloudinary/dto/move-images.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AdminGuard } from '@/modules/auth/admin.guard';

@Controller('images')
@UseGuards(JwtAuthGuard)
@ApiTags('images')
@ApiBearerAuth()
export class CloudinaryController {
  constructor(private readonly service: CloudinaryService) {}

  @Get('signature')
  @ApiOperation({
    summary: 'Get Cloudinary upload signature',
    description: `Generates a signature for secure direct upload to Cloudinary. This signature is required for client-side uploads and expires after a short time.
    
    Upload Flow:
    1. Frontend requests a signature from this endpoint
    2. Backend generates a timestamp and signature using Cloudinary API secret
    3. Frontend uses the signature, timestamp, and API key to upload directly to Cloudinary
    4. The signature is valid only for a short time window
    
    Security Notes:
    - Each signature is time-bound and expires
    - Signatures are folder-specific
    - API secret is never exposed to the client
    - Requires authentication via JWT
    
    Client Implementation Example:
    \`\`\`javascript
    // 1. Get signature from backend
    const { data: { signature, timestamp, folder } } = await api.get('/images/signature');
    
    // 2. Prepare upload parameters
    const uploadParams = {
      file: imageFile,
      api_key: "your_cloudinary_api_key",
      timestamp: timestamp,
      signature: signature,
      folder: folder,
    };
    
    // 3. Upload to Cloudinary
    const formData = new FormData();
    Object.entries(uploadParams).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
      method: 'POST',
      body: formData,
    });
    \`\`\``,
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns the signature, timestamp and folder for Cloudinary upload',
    schema: {
      properties: {
        data: {
          type: 'object',
          properties: {
            signature: {
              type: 'string',
              description:
                'Upload signature generated using Cloudinary API secret',
              example: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
            },
            timestamp: {
              type: 'number',
              description: 'Unix timestamp when the signature was generated',
              example: 1678945200,
            },
            folder: {
              type: 'string',
              description: 'Target upload folder in Cloudinary',
              example: 'blog',
            },
          },
        },
      },
    },
  })
  getSignature() {
    return { data: this.service.generateSignature() };
  }

  @Delete(':publicId')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Delete image from Cloudinary',
    description:
      'Removes an image from Cloudinary storage. Only accessible by administrators.',
  })
  @ApiParam({
    name: 'publicId',
    description:
      'Cloudinary public ID of the image. Can be the full path after /upload/ in the URL or just the ID.',
    example:
      'blog/image-123 or https://res.cloudinary.com/mycloud/image/upload/blog/image-123.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'Image successfully deleted',
    schema: {
      properties: {
        data: {
          type: 'object',
          properties: {
            deleted: {
              type: 'string',
              description: 'Public ID of the deleted image',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async remove(@Param('publicId') id: string) {
    await this.service.delete(id);
    return { data: { deleted: id } };
  }

  @Post('move')
  @ApiOperation({
    summary: 'Move images to different folder',
    description:
      'Moves one or more images to a specified folder in Cloudinary. This operation renames the images to place them in the new folder while maintaining their original filenames.',
  })
  @ApiBody({
    type: MoveImagesDto,
    description:
      'List of image URLs or public IDs to move and the target folder',
    examples: {
      example1: {
        value: {
          images: [
            'blog/temp/image1',
            'https://res.cloudinary.com/mycloud/image/upload/blog/temp/image2.jpg',
          ],
          targetFolder: 'blog/published',
        },
        summary: 'Move images from temp to published folder',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Images successfully moved',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'string',
            description: 'New public IDs of the moved images',
          },
        },
      },
    },
  })
  async move(@Body() dto: MoveImagesDto) {
    const moved = await this.service.moveImages(dto.images, dto.targetFolder);
    return { data: moved };
  }
}
