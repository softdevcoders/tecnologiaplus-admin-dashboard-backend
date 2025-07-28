import dataSource from '../data-source';
import { Article } from '../../../modules/articles/article.entity';
import { User } from '../../../modules/users/user.entity';
import { Category } from '../../../modules/categories/category.entity';
import getArticles from './data/articles';

export class ArticleSeeder {
  static async execute(): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const categoryRepository = dataSource.getRepository(Category);
    const articleRepository = dataSource.getRepository(Article);

    // Get admin user
    const editorPrincipalUser = await userRepository.findOne({
      where: { email: 'editor@tecnologiaplus.com' },
    });

    if (!editorPrincipalUser) {
      throw new Error(
        'Editor principal user not found. Please run UserSeeder first.',
      );
    }

    // Get some categories
    const categories = await categoryRepository.find();

    const articles = getArticles();

    const articlesToSave = articles.map((article) => ({
      title: article.title,
      content: article.content,
      slug: article.slug,
      summary: article.summary,
      metaKeywords: article.metaKeywords.join(','),
      metaDescription: article.metaDescription,
      isPublished: article.isPublished,
      isPublishedInProduction: article.isPublishedInProduction,
      coverImage: article.coverImage || '',
      author: editorPrincipalUser,
      category: categories.find(
        (category) => category.category_key === article.categoryKey,
      ),
    }));

    await articleRepository.save(articlesToSave);

    console.log('Articles seeded successfully');
  }
}
