import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { VaultService } from './vault.service';
import { Vault, VaultStatus } from './vault.entity';

const mockVault = (): Vault => ({
  id: 'vault-1',
  name: 'Test Vault',
  description: null,
  goalAmount: '10000000000',
  currentBalance: '5000000000',
  deadline: new Date(Date.now() + 10 * 86_400_000),
  status: VaultStatus.ACTIVE,
  contractVaultId: null,
  ownerId: 'user-1',
  owner: null,
  transactions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('VaultService', () => {
  let service: VaultService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ ...mockVault(), ...d })),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultService,
        { provide: getRepositoryToken(Vault), useValue: repo },
      ],
    }).compile();

    service = module.get<VaultService>(VaultService);
  });

  it('creates a vault', async () => {
    const vault = await service.create('user-1', {
      name: 'House Fund',
      goalAmount: '10000000000',
    });
    expect(vault.name).toBe('House Fund');
    expect(repo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException for missing vault', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById('bad-id')).rejects.toThrow(NotFoundException);
  });

  it('calculates goal progress correctly', async () => {
    repo.findOne.mockResolvedValue(mockVault());
    const result = await service.getGoalProgress('vault-1');
    expect(result.progress).toBe(50);
    expect(result.remaining).toBe('5000000000');
    expect(result.timeLeft).toBeGreaterThan(0);
  });

  it('throws ForbiddenException when withdrawing more than balance', async () => {
    repo.findOne.mockResolvedValue(mockVault());
    await expect(service.updateBalance('vault-1', -BigInt('9999999999999'))).rejects.toThrow(ForbiddenException);
  });

  it('marks vault as completed when goal is reached', async () => {
    const vault = mockVault();
    vault.currentBalance = '0';
    repo.findOne.mockResolvedValue(vault);
    const updated = await service.updateBalance('vault-1', BigInt('10000000000'));
    expect(updated.status).toBe(VaultStatus.COMPLETED);
  });
});
