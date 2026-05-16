import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716000000000 implements MigrationInterface {
  name = 'InitialSchema1716000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "displayName" character varying,
        "stellarPublicKey" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "vault_status_enum" AS ENUM ('active', 'completed', 'paused', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "vaults" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "goalAmount" bigint NOT NULL,
        "currentBalance" bigint NOT NULL DEFAULT 0,
        "deadline" TIMESTAMP,
        "status" "vault_status_enum" NOT NULL DEFAULT 'active',
        "contractVaultId" character varying,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vaults" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vaults_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "transaction_type_enum" AS ENUM ('deposit', 'withdraw')
    `);

    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'confirmed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "transaction_type_enum" NOT NULL,
        "amount" bigint NOT NULL,
        "status" "transaction_status_enum" NOT NULL DEFAULT 'pending',
        "txHash" character varying,
        "txXdr" text,
        "vaultId" uuid NOT NULL,
        "userId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_vault" FOREIGN KEY ("vaultId") REFERENCES "vaults"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'goal_progress', 'milestone', 'deadline_reminder',
        'deposit_confirmed', 'withdraw_confirmed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "notification_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Enable uuid-ossp extension for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "vaults"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE "vault_status_enum"`);
  }
}
