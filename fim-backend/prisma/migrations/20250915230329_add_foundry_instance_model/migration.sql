-- CreateEnum
CREATE TYPE "public"."FoundryInstanceStatus" AS ENUM ('CREATING', 'RUNNING', 'STOPPED', 'ERROR', 'DELETING');

-- CreateTable
CREATE TABLE "public"."foundry_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."FoundryInstanceStatus" NOT NULL DEFAULT 'CREATING',
    "port" INTEGER NOT NULL,
    "dockerContainerId" TEXT,
    "ownerId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundry_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foundry_instances_name_key" ON "public"."foundry_instances"("name");

-- CreateIndex
CREATE UNIQUE INDEX "foundry_instances_port_key" ON "public"."foundry_instances"("port");

-- CreateIndex
CREATE UNIQUE INDEX "foundry_instances_dockerContainerId_key" ON "public"."foundry_instances"("dockerContainerId");

-- AddForeignKey
ALTER TABLE "public"."foundry_instances" ADD CONSTRAINT "foundry_instances_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
