import { Controller, Get, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOneById(req.user.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password: _, ...result } = user;
    return result;
  }

  @Get('search')
  async search(@Query('q') query: string, @Request() req) {
    if (!query) {
      return [];
    }
    const users = await this.usersService.searchUsers(query, req.user.sub);
    return users.map(user => {
      const { password: _, ...result } = user;
      return result;
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password: _, ...result } = user;
    return result;
  }
}
