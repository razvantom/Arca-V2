import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { GeoService } from "./geo.service";

@Controller("/api/v1/geo")
export class GeoController {
  constructor(private geo: GeoService) {}

  @Get("/counties")
  listCounties() {
    return this.geo.listCounties();
  }

  @Get("/counties/:countyId/organizations")
  listOrganizations(@Param("countyId", ParseIntPipe) countyId: number) {
    return this.geo.listOrganizationsByCounty(countyId);
  }

  @Get("/organizations/:orgId/localities")
  listLocalities(@Param("orgId", ParseIntPipe) orgId: number) {
    return this.geo.listLocalitiesByOrganization(orgId);
  }

  @Get("/localities/:localityId/polling-sections")
  listPollingSections(@Param("localityId", ParseIntPipe) localityId: number) {
    return this.geo.listPollingSectionsByLocality(localityId);
  }
}
