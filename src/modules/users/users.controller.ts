import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateStellarKeyDto } from './dto/update-stellar-key.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return this.users.getProfile(req.user.id);
  }

  @Get('vaults')
  @ApiOperation({ summary: 'Get all vaults owned by the current user' })
  getVaults(@Request() req) {
    return this.users.getVaults(req.user.id);
  }

  @Patch('me/stellar-key')
  @ApiOperation({ summary: 'Link a Stellar public key to the account' })
  updateStellarKey(@Request() req, @Body() dto: UpdateStellarKeyDto) {
    return this.users.updateStellarKey(req.user.id, dto.stellarPublicKey);
  }
}
