import { Controller, Post, Body, Param, Req } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('create')
  async createComment(@Body() payload: string, @Req() req: any) {
    const dataCurrentUser = req.user;
    const createdComment = await this.commentService.createComment(
      payload,
      dataCurrentUser,
    );
    return createdComment;
  }
}
