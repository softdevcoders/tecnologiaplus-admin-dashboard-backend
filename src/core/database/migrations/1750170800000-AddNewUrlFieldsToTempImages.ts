import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewUrlFieldsToTempImages1750170800000
  implements MigrationInterface
{
  name = 'AddNewUrlFieldsToTempImages1750170800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "temp_images" 
      ADD COLUMN "newUrl" VARCHAR NULL,
      ADD COLUMN "newPublicId" VARCHAR NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "temp_images" 
      DROP COLUMN "newUrl",
      DROP COLUMN "newPublicId"
    `);
  }
}
