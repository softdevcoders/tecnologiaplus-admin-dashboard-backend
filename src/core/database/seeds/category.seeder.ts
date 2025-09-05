import dataSource from '../data-source';
import { Category } from '../../../modules/categories/category.entity';
import { categories } from './data/categories';

export class CategorySeeder {
  static async execute(): Promise<void> {
    const categoryRepository = dataSource.getRepository(Category);

    const categoriesAlreadySeeded = await categoryRepository.find();

    if (categoriesAlreadySeeded.length > 0) {
      console.log('Categories already seeded');
      return;
    }

    await categoryRepository.save(categories);
  }
}
