import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateArticleTable1750170482099 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'article',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'summary',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metaKeywords',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metaDescription',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metaTitle',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'coverImage',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isPublished',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isPublishedInProduction',
            type: 'boolean',
            default: false,
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'authorId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'categoryId',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
    );

    // Add Foreign Keys for Article
    await queryRunner.createForeignKey(
      'article',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );

    await queryRunner.createForeignKey(
      'article',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedTableName: 'category',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'article',
      'FK_a9c5f4ec6cceb1604b4a3c84c87',
    );
    await queryRunner.dropForeignKey(
      'article',
      'FK_12824e4598ee46a0992d99ba553',
    );
    await queryRunner.dropTable('article');
  }
}
