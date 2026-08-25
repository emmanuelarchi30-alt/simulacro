import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatar1790000000000 implements MigrationInterface {
  name = 'AddUserAvatar1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "avatar" character varying(500) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
  }
}
