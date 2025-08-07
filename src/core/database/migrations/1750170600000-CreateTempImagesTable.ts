import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTempImagesTable1750170600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'temp_images',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'cloudinaryUrl',
            type: 'text',
          },
          {
            name: 'cloudinaryPublicId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'fileSize',
            type: 'int',
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'isUsed',
            type: 'boolean',
            default: false,
          },
        ],
      }),
      true,
    );

    // Crear índices usando queries SQL directos
    await queryRunner.query(
      'CREATE INDEX "IDX_TEMP_IMAGES_SESSION_TYPE" ON "temp_images" ("sessionId", "type")',
    );

    await queryRunner.query(
      'CREATE INDEX "IDX_TEMP_IMAGES_EXPIRES_AT" ON "temp_images" ("expiresAt")',
    );

    await queryRunner.query(
      'CREATE INDEX "IDX_TEMP_IMAGES_IS_USED" ON "temp_images" ("isUsed")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('temp_images');
  }
}
