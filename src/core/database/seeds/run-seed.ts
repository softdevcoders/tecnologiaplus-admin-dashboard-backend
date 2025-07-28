import dataSource from '../data-source';
import { CategorySeeder } from './category.seeder';
import { TagSeeder } from './tag.seeder';
import { UserSeeder } from './user.seeder';
import { ArticleSeeder } from './article.seeder';

const runSeed = async () => {
  await dataSource.initialize();

  // Run seeders in order (respecting dependencies)
  await UserSeeder.execute();
  await CategorySeeder.execute();
  await TagSeeder.execute();
  await ArticleSeeder.execute();

  await dataSource.destroy();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
runSeed();
