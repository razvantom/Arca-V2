import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";

const validDto: RegisterDto = {
  email: "test@example.com",
  password: "Password123!",
  firstName: "Ion",
  lastName: "Popescu",
  countyId: 1,
  organizationId: 10,
  localityId: 100,
  pollingSectionId: 1000,
};

describe("AuthService – register geo chain validation", () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      organization: { findUnique: jest.fn() },
      locality: { findUnique: jest.fn() },
      pollingSection: { findUnique: jest.fn() },
      role: { findUnique: jest.fn() },
      user: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue("mock-token") },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("7d") },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  it("should reject when organization does not belong to county", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      countyId: 99, // wrong county
    });

    await expect(service.register(validDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject when organization does not exist", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.register(validDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject when locality does not belong to organization", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      countyId: 1, // correct county
    });
    (prisma.locality.findUnique as jest.Mock).mockResolvedValue({
      id: 100,
      organizationId: 99, // wrong org
    });

    await expect(service.register(validDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject when locality does not exist", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      countyId: 1,
    });
    (prisma.locality.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.register(validDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject when pollingSection does not belong to locality", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      countyId: 1,
    });
    (prisma.locality.findUnique as jest.Mock).mockResolvedValue({
      id: 100,
      organizationId: 10,
    });
    (prisma.pollingSection.findUnique as jest.Mock).mockResolvedValue({
      id: 1000,
      localityId: 99, // wrong locality
    });

    await expect(service.register(validDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should reject when pollingSection does not exist", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      countyId: 1,
    });
    (prisma.locality.findUnique as jest.Mock).mockResolvedValue({
      id: 100,
      organizationId: 10,
    });
    (prisma.pollingSection.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.register(validDto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("should return accessToken and refreshToken on successful registration", async () => {
    (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
      id: 10,
      countyId: 1,
    });
    (prisma.locality.findUnique as jest.Mock).mockResolvedValue({
      id: 100,
      organizationId: 10,
    });
    (prisma.pollingSection.findUnique as jest.Mock).mockResolvedValue({
      id: 1000,
      localityId: 100,
    });
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      key: "SUPPORTER",
    });
    const mockUser = {
      id: "user-uuid",
      firstName: "Ion",
      lastName: "Popescu",
      email: "test@example.com",
      phone: null,
    };
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.register(validDto);

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result).toHaveProperty("user");
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
  });
});
