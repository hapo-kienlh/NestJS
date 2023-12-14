import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { PostController } from './post.controller';
import { PostsService } from './post.service';
import { User } from 'src/users/user.entity';
import { AuthMiddleware } from 'src/middleware/auth.middleware';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User])],
  controllers: [PostController],
  providers: [PostsService ,AuthService],
})
// export class PostModule {}
export class PostModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('posts');
  }
}
