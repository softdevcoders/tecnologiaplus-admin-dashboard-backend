import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateArticleTagsTable1750170482100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'article_tags_tag',
        columns: [
          {
            name: 'articleId',
            type: 'uuid',
          },
          {
            name: 'tagId',
            type: 'uuid',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['articleId'],
            referencedTableName: 'article',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          {
            columnNames: ['tagId'],
            referencedTableName: 'tag',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
            onUpdate: 'NO ACTION',
          },
        ],
      }),
    );

    // Create Indices for article_tags_tag
    await queryRunner.createIndex(
      'article_tags_tag',
      new TableIndex({
        name: 'IDX_article_tags_articleId',
        columnNames: ['articleId'],
      }),
    );

    await queryRunner.createIndex(
      'article_tags_tag',
      new TableIndex({
        name: 'IDX_article_tags_tagId',
        columnNames: ['tagId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('article_tags_tag');
  }
}
