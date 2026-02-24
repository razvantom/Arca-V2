-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RoleScopeType" AS ENUM ('GLOBAL', 'COUNTY', 'ORG', 'SELF');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('NATIONAL', 'COUNTY', 'ORG');

-- CreateEnum
CREATE TYPE "LeadershipFunction" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "countyId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "localityId" INTEGER NOT NULL,
    "pollingSectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopeType" "RoleScopeType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "countyId" INTEGER,
    "organizationId" INTEGER,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "County" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "countyId" INTEGER NOT NULL,
    "siruta" INTEGER,
    "name" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locality" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Locality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollingSection" (
    "id" SERIAL NOT NULL,
    "localityId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,

    CONSTRAINT "PollingSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "countyId" INTEGER,
    "organizationId" INTEGER,
    "function" "LeadershipFunction" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),

    CONSTRAINT "LeadershipAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "scopeType" TEXT,
    "countyId" INTEGER,
    "organizationId" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "UserProfile_countyId_idx" ON "UserProfile"("countyId");

-- CreateIndex
CREATE INDEX "UserProfile_organizationId_idx" ON "UserProfile"("organizationId");

-- CreateIndex
CREATE INDEX "UserProfile_localityId_idx" ON "UserProfile"("localityId");

-- CreateIndex
CREATE INDEX "UserProfile_pollingSectionId_idx" ON "UserProfile"("pollingSectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE INDEX "AccessAssignment_userId_idx" ON "AccessAssignment"("userId");

-- CreateIndex
CREATE INDEX "AccessAssignment_roleId_idx" ON "AccessAssignment"("roleId");

-- CreateIndex
CREATE INDEX "AccessAssignment_countyId_idx" ON "AccessAssignment"("countyId");

-- CreateIndex
CREATE INDEX "AccessAssignment_organizationId_idx" ON "AccessAssignment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "County_name_key" ON "County"("name");

-- CreateIndex
CREATE UNIQUE INDEX "County_slug_key" ON "County"("slug");

-- CreateIndex
CREATE INDEX "Organization_countyId_idx" ON "Organization"("countyId");

-- CreateIndex
CREATE INDEX "Organization_siruta_idx" ON "Organization"("siruta");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_countyId_name_key" ON "Organization"("countyId", "name");

-- CreateIndex
CREATE INDEX "Locality_organizationId_idx" ON "Locality"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Locality_organizationId_name_key" ON "Locality"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PollingSection_localityId_idx" ON "PollingSection"("localityId");

-- CreateIndex
CREATE INDEX "PollingSection_code_idx" ON "PollingSection"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PollingSection_localityId_number_key" ON "PollingSection"("localityId", "number");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_status_idx" ON "Membership"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "LeadershipAssignment_userId_idx" ON "LeadershipAssignment"("userId");

-- CreateIndex
CREATE INDEX "LeadershipAssignment_unitType_idx" ON "LeadershipAssignment"("unitType");

-- CreateIndex
CREATE INDEX "LeadershipAssignment_countyId_idx" ON "LeadershipAssignment"("countyId");

-- CreateIndex
CREATE INDEX "LeadershipAssignment_organizationId_idx" ON "LeadershipAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_pollingSectionId_fkey" FOREIGN KEY ("pollingSectionId") REFERENCES "PollingSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessAssignment" ADD CONSTRAINT "AccessAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessAssignment" ADD CONSTRAINT "AccessAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessAssignment" ADD CONSTRAINT "AccessAssignment_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessAssignment" ADD CONSTRAINT "AccessAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locality" ADD CONSTRAINT "Locality_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollingSection" ADD CONSTRAINT "PollingSection_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipAssignment" ADD CONSTRAINT "LeadershipAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipAssignment" ADD CONSTRAINT "LeadershipAssignment_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipAssignment" ADD CONSTRAINT "LeadershipAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
