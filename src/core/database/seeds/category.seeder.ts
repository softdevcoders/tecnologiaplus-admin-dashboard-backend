import dataSource from '../data-source';
import { Category } from '../../../modules/categories/category.entity';
import { categories } from './data/categories';

export class CategorySeeder {
  static async execute(): Promise<void> {
    const categoryRepository = dataSource.getRepository(Category);

    await categoryRepository.save(categories);
  }
}
