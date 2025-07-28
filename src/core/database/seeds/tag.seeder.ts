import dataSource from '../data-source';
import { Tag } from '../../../modules/tags/tag.entity';
import { tags } from './data/tags';

export class TagSeeder {
  static async execute(): Promise<void> {
    const tagRepository = dataSource.getRepository(Tag);

    for (const tagData of tags as Tag[]) {
      const existingTag = await tagRepository.findOne({
        where: { slug: tagData.slug },
      });

      if (!existingTag) {
        const tag = tagRepository.create(tagData);
        await tagRepository.save(tag);
      }
    }
  }
}
