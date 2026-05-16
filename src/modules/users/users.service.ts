import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(data: Partial<User>) {
    return this.repo.save(this.repo.create(data));
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async updateStellarKey(userId: string, stellarPublicKey: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.stellarPublicKey = stellarPublicKey;
    return this.repo.save(user);
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getVaults(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId }, relations: ['vaults'] });
    if (!user) throw new NotFoundException('User not found');
    return user.vaults;
  }
}
