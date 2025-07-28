import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../../modules/users/user.entity';
import { Article } from '../../modules/articles/article.entity';
import { Category } from '../../modules/categories/category.entity';
import { Tag } from '../../modules/tags/tag.entity';

// Ensure environment variables are loaded
config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'blog_db',
  entities: [User, Article, Category, Tag],
  migrations: ['src/core/database/migrations/*.ts'],
  synchronize: false,
  logging: true, // Enable logging to see SQL queries
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
