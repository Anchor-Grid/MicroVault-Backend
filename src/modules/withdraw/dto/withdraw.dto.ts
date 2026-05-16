import { IsUUID, IsNumberString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({ example: 'vault-uuid' })
  @IsUUID()
  vaultId: string;

  @ApiProperty({ example: '200000000', description: 'Amount in stroops' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ example: 'SXXXXX...', description: 'Caller Stellar secret key for signing' })
  @IsString()
  signerSecret: string;
}
