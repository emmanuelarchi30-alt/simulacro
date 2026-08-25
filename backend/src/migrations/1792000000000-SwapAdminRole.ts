import { MigrationInterface, QueryRunner } from 'typeorm';

const FORMER_ADMIN_EMAIL = 'admin@examen.com';
const NEW_ADMIN_EMAIL = 'emmanuel@gmail.com';

export class SwapAdminRole1792000000000 implements MigrationInterface {
  name = 'SwapAdminRole1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'user' WHERE "email" = $1`,
      [FORMER_ADMIN_EMAIL],
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'admin' WHERE "email" = $1`,
      [NEW_ADMIN_EMAIL],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'user' WHERE "email" = $1`,
      [NEW_ADMIN_EMAIL],
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'admin' WHERE "email" = $1`,
      [FORMER_ADMIN_EMAIL],
    );
  }
}
