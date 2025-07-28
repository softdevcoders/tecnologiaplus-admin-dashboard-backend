import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag) private readonly repo: Repository<Tag>,
    private readonly i18n: I18nService,
  ) {}

  findAll(): Promise<Tag[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException(this.i18n.t('errors.tag_not_found'));
    return tag;
  }

  create(dto: CreateTagDto): Promise<Tag> {
    const tag = this.repo.create(dto);
    return this.repo.save(tag);
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);
    Object.assign(tag, dto);
    return this.repo.save(tag);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
