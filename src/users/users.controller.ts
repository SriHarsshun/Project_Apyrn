import { Controller, Get, Post, Patch, Delete, Body, Param, Version, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyContextGuard } from '../common/guards/company-context.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get all users in company' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@CompanyId() companyId: string): Promise<{ data: UserResponseDto[] }> {
    const data = await this.usersService.findAll(companyId);
    return { data };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findById(@Param('id') id: string, @CompanyId() companyId: string): Promise<{ data: UserResponseDto }> {
    const data = await this.usersService.findById(id, companyId);
    return { data };
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(
    @Body() dto: CreateUserDto,
    @CompanyId() companyId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ data: UserResponseDto }> {
    const data = await this.usersService.create(dto, companyId, currentUserId);
    return { data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CompanyId() companyId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ data: UserResponseDto }> {
    const data = await this.usersService.update(id, dto, companyId, currentUserId);
    return { data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ data: UserResponseDto }> {
    const data = await this.usersService.delete(id, companyId, currentUserId);
    return { data };
  }
}
