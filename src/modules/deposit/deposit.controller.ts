import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepositService } from './deposit.service';
import { DepositDto } from './dto/deposit.dto';

@ApiTags('deposit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vault')
export class DepositController {
  constructor(private deposits: DepositService) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit into a vault (signs and submits on-chain)' })
  deposit(@Request() req, @Body() dto: DepositDto) {
    return this.deposits.deposit(req.user.id, dto);
  }
}
