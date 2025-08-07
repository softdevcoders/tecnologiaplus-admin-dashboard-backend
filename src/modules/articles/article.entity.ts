import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Category } from '../categories/category.entity';
import { Tag } from '../tags/tag.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  summary: string;

  @Column({ nullable: true })
  metaTitle: string;

  @Column('text')
  content: string;

  @Column({ nullable: false })
  metaKeywords: string;

  @Column({ nullable: false })
  metaDescription: string;

  @Column({ nullable: false })
  coverImage: string;

  @Column('text', { nullable: true })
  images?: string;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  isPublishedInProduction: boolean;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => User, (user) => user.articles, { eager: true })
  author: User;

  @ManyToOne(() => Category, (cat) => cat.articles, {
    eager: true,
    nullable: true,
  })
  category?: Category;

  @ManyToMany(() => Tag, (tag) => tag.articles, { eager: true })
  @JoinTable()
  tags?: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
