import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoverImageAltToArticle1754681238193
  implements MigrationInterface
{
  name = 'AddCoverImageAltToArticle1754681238193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna ya existe antes de agregarla
    const hasColumn = await queryRunner.hasColumn('article', 'coverImageAlt');
    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "article" ADD "coverImageAlt" character varying(500)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('article', 'coverImageAlt');
    if (hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "article" DROP COLUMN "coverImageAlt"`,
      );
    }
  }
}
