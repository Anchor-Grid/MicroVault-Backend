import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStellarKeyDto {
  @ApiProperty({ example: 'GABC...XYZ' })
  @IsString()
  @Matches(/^G[A-Z2-7]{55}$/, { message: 'Invalid Stellar public key' })
  stellarPublicKey: string;
}
