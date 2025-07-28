import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
    private readonly i18n: I18nService,
  ) {}

  findAll(includeDeleted = false): Promise<Category[]> {
    return this.repo.find({
      withDeleted: includeDeleted,
      relations: ['articles'],
    });
  }

  async findOne(id: string): Promise<Category> {
    const cat = await this.repo.findOne({
      where: { id },
      withDeleted: true,
      relations: ['articles'],
    });
    if (!cat)
      throw new NotFoundException(this.i18n.t('errors.category_not_found'));
    return cat;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const cat = this.repo.create(dto);
    return this.repo.save(cat);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const cat = await this.findOne(id);
    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
