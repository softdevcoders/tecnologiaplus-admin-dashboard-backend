import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatusColumn1750170482099 implements MigrationInterface {
  name = 'AddUserStatusColumn1750170482099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el enum UserStatus
    await queryRunner.query(`
      CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'DEACTIVATED')
    `);

    // Agregar la columna status con valor por defecto ACTIVE
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN "status" "public"."user_status_enum" NOT NULL DEFAULT 'ACTIVE'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna status
    await queryRunner.query(`
      ALTER TABLE "user" DROP COLUMN "status"
    `);

    // Eliminar el enum UserStatus
    await queryRunner.query(`
      DROP TYPE "public"."user_status_enum"
    `);
  }
}
