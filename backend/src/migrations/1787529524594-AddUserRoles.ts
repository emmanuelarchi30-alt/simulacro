import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@examen.com';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_NAME = 'Administrador';

export class AddUserRoles1787529524594 implements MigrationInterface {
  name = 'AddUserRoles1787529524594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`,
    );

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await queryRunner.query(
      `INSERT INTO "users" ("name", "email", "password", "role") VALUES ($1, $2, $3, 'admin')`,
      [ADMIN_NAME, ADMIN_EMAIL, hashedPassword],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      ADMIN_EMAIL,
    ]);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
