import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WithdrawService } from './withdraw.service';
import { WithdrawDto } from './dto/withdraw.dto';

@ApiTags('withdraw')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vault')
export class WithdrawController {
  constructor(private withdraws: WithdrawService) {}

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw from a vault (signs and submits on-chain)' })
  withdraw(@Request() req, @Body() dto: WithdrawDto) {
    return this.withdraws.withdraw(req.user.id, dto);
  }
}
