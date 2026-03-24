import { Controller, Get, Post, Body, Param, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  async create(@Body(new ValidationPipe()) createChatDto: CreateChatDto, @Request() req) {
    if (createChatDto.isGroup) {
      return this.chatsService.createGroupChat(
        createChatDto.name ?? '',
        createChatDto.userIds,
        req.user.sub,
      );
    } else {
      return this.chatsService.findOrCreateDirectChat(
        createChatDto.userIds,
        req.user.sub,
      );
    }
  }

  @Get()
  async findAll(@Request() req) {
    return this.chatsService.findAllForUser(req.user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.chatsService.findOne(id, req.user.sub);
  }
}
