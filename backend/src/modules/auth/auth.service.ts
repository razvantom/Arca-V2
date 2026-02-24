import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private async validateGeo(dto: RegisterDto) {
    const org = await this.prisma.organization.findUnique({ where: { id: dto.organizationId } });
    if (!org || org.countyId !== dto.countyId) {
      throw new BadRequestException("Invalid county/organization relation");
    }

    const locality = await this.prisma.locality.findUnique({ where: { id: dto.localityId } });
    if (!locality || locality.organizationId !== dto.organizationId) {
      throw new BadRequestException("Invalid organization/locality relation");
    }

    const section = await this.prisma.pollingSection.findUnique({ where: { id: dto.pollingSectionId } });
    if (!section || section.localityId !== dto.localityId) {
      throw new BadRequestException("Invalid locality/polling section relation");
    }
  }

  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException("Provide email or phone");
    }

    await this.validateGeo(dto);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // default: SUPPORTER + membership PENDING
    const role = await this.prisma.role.findUnique({ where: { key: "SUPPORTER" } });
    if (!role) throw new BadRequestException("Role SUPPORTER missing. Run seed.");

    const user = await this.prisma.user.create({
      data: {
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        profile: {
          create: {
            countyId: dto.countyId,
            organizationId: dto.organizationId,
            localityId: dto.localityId,
            pollingSectionId: dto.pollingSectionId,
          },
        },
        memberships: {
          create: {
            organizationId: dto.organizationId,
            status: "PENDING",
          },
        },
        access: {
          create: {
            roleId: role.id,
          },
        },
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { user, accessToken };
  }

  async login(dto: LoginDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException("Provide email or phone");
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { accessToken };
  }
}
