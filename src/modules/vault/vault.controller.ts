import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VaultService } from './vault.service';
import { CreateVaultDto } from './dto/create-vault.dto';

@ApiTags('vault')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vault')
export class VaultController {
  constructor(private vaults: VaultService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new savings vault' })
  create(@Request() req, @Body() dto: CreateVaultDto) {
    return this.vaults.create(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vault by ID' })
  findOne(@Param('id') id: string) {
    return this.vaults.findById(id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get goal progress, remaining amount, and time left' })
  progress(@Param('id') id: string) {
    return this.vaults.getGoalProgress(id);
  }
}
