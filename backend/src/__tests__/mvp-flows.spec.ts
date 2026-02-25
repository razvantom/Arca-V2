import { execSync } from "child_process";
import * as path from "path";
import request = require("supertest");
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/arca_test?schema=public";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret";
}

jest.setTimeout(30000);

const projectRoot = path.resolve(__dirname, "..", "..");

const truncateSql =
  'TRUNCATE TABLE "AuditLog", "LeadershipAssignment", "AccessAssignment", "Membership", "UserProfile", "User", "PollingSection", "Locality", "Organization", "County", "Role" RESTART IDENTITY CASCADE;';

type GeoSeed = {
  county: { id: number; name: string; slug: string };
  organization: { id: number; name: string; countyId: number };
  locality: { id: number; name: string; organizationId: number };
  pollingSection: { id: number; number: number; localityId: number };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

async function seedRoles(prisma: PrismaService) {
  await prisma.role.createMany({
    data: [
      { key: "ADMIN_ARCA", name: "Admin ARCA", scopeType: "GLOBAL", sortOrder: 0 },
      { key: "COUNTY_PRESIDENT", name: "County President", scopeType: "COUNTY", sortOrder: 10 },
      { key: "MEMBER", name: "Member", scopeType: "SELF", sortOrder: 210 },
      { key: "SUPPORTER", name: "Supporter", scopeType: "SELF", sortOrder: 220 },
    ],
  });
}

async function seedGeo(prisma: PrismaService, suffix: string): Promise<GeoSeed> {
  const countyName = `County ${suffix}`;
  const county = await prisma.county.create({
    data: { name: countyName, slug: slugify(countyName) },
  });
  const organization = await prisma.organization.create({
    data: { name: `Org ${suffix}`, countyId: county.id },
  });
  const locality = await prisma.locality.create({
    data: { name: `Locality ${suffix}`, organizationId: organization.id },
  });
  const pollingSection = await prisma.pollingSection.create({
    data: { localityId: locality.id, number: 1, name: `Section ${suffix}` },
  });

  return { county, organization, locality, pollingSection };
}

describe("MVP integration flows", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeAll(async () => {
    execSync("npx prisma migrate deploy", { cwd: projectRoot, stdio: "inherit" });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(truncateSql);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/geo/counties returns list", async () => {
    const county = await prisma.county.create({
      data: { name: "Test County", slug: "test-county" },
    });

    const response = await request(app.getHttpServer())
      .get("/api/v1/geo/counties")
      .expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: county.id, name: county.name })]),
    );
  });

  it("POST /api/v1/auth/register validates geo chain and creates user, profile, membership", async () => {
    await seedRoles(prisma);
    const geo = await seedGeo(prisma, "A");

    const payload = {
      email: "mvp@example.com",
      password: "Password123!",
      firstName: "Mvp",
      lastName: "User",
      countyId: geo.county.id,
      organizationId: geo.organization.id,
      localityId: geo.locality.id,
      pollingSectionId: geo.pollingSection.id,
    };

    const response = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty("accessToken");
    expect(response.body.user).toEqual(expect.objectContaining({ email: payload.email }));

    const created = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { profile: true, memberships: true },
    });

    expect(created).not.toBeNull();
    expect(created?.profile).toMatchObject({
      countyId: geo.county.id,
      organizationId: geo.organization.id,
      localityId: geo.locality.id,
      pollingSectionId: geo.pollingSection.id,
    });
    expect(created?.memberships[0]).toMatchObject({
      status: "PENDING",
      organizationId: geo.organization.id,
    });
  });

  it("POST /api/v1/memberships/:id/approve activates membership and assigns MEMBER role", async () => {
    await seedRoles(prisma);
    const geo = await seedGeo(prisma, "B");

    const member = await prisma.user.create({
      data: {
        email: "member@example.com",
        passwordHash: "hash",
        firstName: "Member",
        lastName: "User",
      },
    });
    const membership = await prisma.membership.create({
      data: { userId: member.id, organizationId: geo.organization.id },
    });

    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash: "hash",
        firstName: "Admin",
        lastName: "User",
      },
    });
    const adminRole = await prisma.role.findUnique({ where: { key: "ADMIN_ARCA" } });
    await prisma.accessAssignment.create({
      data: { userId: admin.id, roleId: adminRole!.id },
    });

    const token = await jwt.signAsync({ sub: admin.id });
    const response = await request(app.getHttpServer())
      .post(`/api/v1/memberships/${membership.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    expect(response.body.status).toBe("ACTIVE");
    const updated = await prisma.membership.findUnique({ where: { id: membership.id } });
    expect(updated?.status).toBe("ACTIVE");

    const memberRole = await prisma.role.findUnique({ where: { key: "MEMBER" } });
    const assignment = await prisma.accessAssignment.findFirst({
      where: { userId: member.id, roleId: memberRole!.id },
    });
    expect(assignment).not.toBeNull();
  });

  it("blocks cross-county approvals with FORBIDDEN", async () => {
    await seedRoles(prisma);
    const geoA = await seedGeo(prisma, "A");
    const geoB = await seedGeo(prisma, "B");

    const countyActor = await prisma.user.create({
      data: {
        email: "county@example.com",
        passwordHash: "hash",
        firstName: "County",
        lastName: "Actor",
      },
    });
    const countyRole = await prisma.role.findUnique({ where: { key: "COUNTY_PRESIDENT" } });
    await prisma.accessAssignment.create({
      data: { userId: countyActor.id, roleId: countyRole!.id, countyId: geoA.county.id },
    });

    const member = await prisma.user.create({
      data: {
        email: "other@example.com",
        passwordHash: "hash",
        firstName: "Other",
        lastName: "Member",
      },
    });
    const membership = await prisma.membership.create({
      data: { userId: member.id, organizationId: geoB.organization.id },
    });

    const token = await jwt.signAsync({ sub: countyActor.id });
    await request(app.getHttpServer())
      .post(`/api/v1/memberships/${membership.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });
});
