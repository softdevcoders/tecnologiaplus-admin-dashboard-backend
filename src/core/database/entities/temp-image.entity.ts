import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('temp_images')
@Index(['sessionId', 'type'])
@Index(['expiresAt'])
export class TempImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  cloudinaryUrl: string;

  @Column()
  cloudinaryPublicId: string;

  @Column()
  type: 'cover' | 'content';

  @Column()
  fileName: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean; // Para marcar si la imagen fue usada en un artículo
}
