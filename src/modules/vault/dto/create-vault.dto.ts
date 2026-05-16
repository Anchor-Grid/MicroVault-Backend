import { IsString, IsOptional, IsDateString, IsNumberString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVaultDto {
  @ApiProperty({ example: 'House Fund' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Saving for a new house', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '10000000000', description: 'Goal in stroops (1 XLM = 10_000_000)' })
  @IsNumberString()
  goalAmount: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
