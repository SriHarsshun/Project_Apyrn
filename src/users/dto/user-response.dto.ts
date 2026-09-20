import { ApiProperty } from '@nestjs/swagger';
import { Prisma, Role } from '@prisma/client';

type User = Prisma.UserGetPayload<{}>;

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      createdAt: user.createdAt,
    };
  }
}
