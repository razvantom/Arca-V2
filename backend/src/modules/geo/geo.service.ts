import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  listCounties() {
    return this.prisma.county.findMany({ orderBy: { name: "asc" } });
  }

  listOrganizationsByCounty(countyId: number) {
    return this.prisma.organization.findMany({
      where: { countyId },
      orderBy: { name: "asc" },
    });
  }

  listLocalitiesByOrganization(organizationId: number) {
    return this.prisma.locality.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  listPollingSectionsByLocality(localityId: number) {
    return this.prisma.pollingSection.findMany({
      where: { localityId },
      orderBy: { number: "asc" },
    });
  }
}
