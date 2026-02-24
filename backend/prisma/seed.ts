import { PrismaClient } from "@prisma/client";
import * as path from "path";
import * as fs from "fs";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function seedRoles() {
  const roles = [
    { key: "ADMIN_ARCA", name: "Admini ARCA", scopeType: "GLOBAL", sortOrder: 0 },

    { key: "COUNTY_PRESIDENT", name: "Președinte filială", scopeType: "COUNTY", sortOrder: 10 },
    { key: "COUNTY_VICE", name: "Vicepreședinte filială", scopeType: "COUNTY", sortOrder: 20 },
    { key: "COUNTY_SECRETARY", name: "Secretar filială", scopeType: "COUNTY", sortOrder: 30 },
    { key: "COUNTY_TREASURER", name: "Trezorier filială", scopeType: "COUNTY", sortOrder: 40 },

    { key: "ORG_PRESIDENT", name: "Președinte organizație", scopeType: "ORG", sortOrder: 110 },
    { key: "ORG_VICE", name: "Vicepreședinte organizație", scopeType: "ORG", sortOrder: 120 },
    { key: "ORG_SECRETARY", name: "Secretar organizație", scopeType: "ORG", sortOrder: 130 },
    { key: "ORG_TREASURER", name: "Trezorier organizație", scopeType: "ORG", sortOrder: 140 },

    { key: "MEMBER", name: "Membru", scopeType: "SELF", sortOrder: 210 },
    { key: "SUPPORTER", name: "Simpatizant", scopeType: "SELF", sortOrder: 220 },
  ] as const;

  for (const r of roles) {
    await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, scopeType: r.scopeType as any, sortOrder: r.sortOrder },
      create: { key: r.key, name: r.name, scopeType: r.scopeType as any, sortOrder: r.sortOrder },
    });
  }
}

type Row = {
  ["Județe"]?: string;
  ["UAT"]?: string;
  ["uat_siruta"]?: number;
  ["localitate"]?: string;
  ["nr_sv"]?: number;
  ["cod_sectie"]?: string;
  ["den_sv"]?: string;
};

async function seedGeoFromExcel(excelPath: string) {
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel not found at: ${excelPath}`);
  }

  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: null });

  const countyCache = new Map<string, number>();
  const orgCache = new Map<string, number>();
  const localityCache = new Map<string, number>();

  for (const row of rows) {
    const countyNameRaw = (row["Județe"] || "").toString().trim();
    const uatNameRaw = (row["UAT"] || "").toString().trim();
    const localityNameRaw = (row["localitate"] || "").toString().trim();
    const sectionNumber = Number(row["nr_sv"] ?? NaN);
    const sectionCode = (row["cod_sectie"] || "").toString().trim() || null;
    const sectionName = (row["den_sv"] || "").toString().trim();
    const siruta = row["uat_siruta"] != null ? Number(row["uat_siruta"]) : null;

    if (!countyNameRaw || !uatNameRaw || !localityNameRaw || !Number.isFinite(sectionNumber) || !sectionName) {
      continue;
    }

    let countyId = countyCache.get(countyNameRaw);
    if (!countyId) {
      const slug = slugify(countyNameRaw);
      const county = await prisma.county.upsert({
        where: { slug },
        update: { name: countyNameRaw },
        create: { name: countyNameRaw, slug },
      });
      countyId = county.id;
      countyCache.set(countyNameRaw, countyId);
    }

    const orgKey = `${countyId}|${uatNameRaw}`;
    let orgId = orgCache.get(orgKey);
    if (!orgId) {
      const org = await prisma.organization.upsert({
        where: { countyId_name: { countyId, name: uatNameRaw } },
        update: { siruta: siruta ?? undefined },
        create: { countyId, name: uatNameRaw, siruta: siruta ?? undefined },
      });
      orgId = org.id;
      orgCache.set(orgKey, orgId);
    }

    const locKey = `${orgId}|${localityNameRaw}`;
    let localityId = localityCache.get(locKey);
    if (!localityId) {
      const loc = await prisma.locality.upsert({
        where: { organizationId_name: { organizationId: orgId, name: localityNameRaw } },
        update: {},
        create: { organizationId: orgId, name: localityNameRaw },
      });
      localityId = loc.id;
      localityCache.set(locKey, localityId);
    }

    await prisma.pollingSection.upsert({
      where: { localityId_number: { localityId, number: sectionNumber } },
      update: { code: sectionCode ?? undefined, name: sectionName },
      create: { localityId, number: sectionNumber, code: sectionCode ?? undefined, name: sectionName },
    });
  }
}

async function main() {
  await seedRoles();

  const excelPath = path.resolve(process.cwd(), "prisma/data/Judete-UAT-SectiiVOT.xlsx");
  await seedGeoFromExcel(excelPath);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
