/*
  Warnings:

  - A unique constraint covering the columns `[password_reset_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "password_reset_expires" TIMESTAMP(3),
ADD COLUMN     "password_reset_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "public"."users"("password_reset_token");
