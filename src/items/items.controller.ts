import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Version,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AdjustItemDto } from './dto/adjust-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { InventorySummaryDto } from './dto/inventory-summary.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CompanyContextGuard } from '../common/guards/company-context.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CompanyId } from '../common/decorators/company-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyContextGuard, RolesGuard)
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get items with pagination and filters' })
  @ApiResponse({ status: 200, type: [ItemResponseDto] })
  async findMany(@Query() query: QueryItemDto, @CompanyId() companyId: string) {
    const result = await this.itemsService.findMany(query, companyId);
    return { data: result };
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiResponse({ status: 200, type: InventorySummaryDto })
  async getSummary(@CompanyId() companyId: string): Promise<{ data: InventorySummaryDto }> {
    const data = await this.itemsService.getInventorySummary(companyId);
    return { data };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  async findById(
    @Param('id') id: string,
    @CompanyId() companyId: string,
  ): Promise<{ data: ItemResponseDto }> {
    const data = await this.itemsService.findById(id, companyId);
    return { data };
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create new item' })
  @ApiResponse({ status: 201, type: ItemResponseDto })
  async create(
    @Body() dto: CreateItemDto,
    @CompanyId() companyId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ data: ItemResponseDto }> {
    const data = await this.itemsService.create(dto, companyId, userId);
    return { data };
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update item' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @CompanyId() companyId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ data: ItemResponseDto }> {
    const data = await this.itemsService.update(id, dto, companyId, userId);
    return { data };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft delete item' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  async remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ data: ItemResponseDto }> {
    const data = await this.itemsService.softDelete(id, companyId, userId);
    return { data };
  }

  @Post(':id/adjust')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Adjust item quantity' })
  @ApiResponse({ status: 200, type: ItemResponseDto })
  async adjustQuantity(
    @Param('id') id: string,
    @Body() dto: AdjustItemDto,
    @CompanyId() companyId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<{ data: ItemResponseDto }> {
    const data = await this.itemsService.adjustQuantity(id, dto, companyId, userId);
    return { data };
  }
}
