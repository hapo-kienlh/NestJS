import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<any> {
    try {

      const postsWithComments = await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user') // Load thông tin người dùng của bài đăng
        .leftJoinAndSelect('post.comments', 'comment') // Load thông tin của các comment
        .leftJoinAndSelect('comment.user', 'commentUser') // Load thông tin người dùng của từng comment
        .getMany();

      // Chỉ trả về các trường cần thiết
      const formattedPosts = postsWithComments.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        user: {
          id: post.user.id,
          username: post.user.username,
          avatar: post.user.avatar,
        },
        comments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          user: {
            id: comment.user.id,
            username: comment.user.username,
            avatar: comment.user.avatar,
          },
        })),
      }));
      return { list_post: formattedPosts };
    } catch (error) {
      throw new Error('Find Post Failed');
    }
  }

  async create(payload: any, dataCurrentUser: any): Promise<any> {
    try {
      const userId = dataCurrentUser?.user?.id;
      const { title, content } = payload;

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      const checkTitle = await this.postRepository.findOne({
        where: { title: title },
      });

      if (checkTitle) {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Title already exists',
        };
      }

      const newPost = new Post();
      newPost.title = title;
      newPost.content = content;
      newPost.user = user;

      await this.postRepository.save(newPost);

      return {
        status: HttpStatus.OK,
        message: 'Create Post Success',
      };
    } catch (error) {
      console.error('Error during post creation:', error);
      throw new Error('Create Failed');
    }
  }

  async findById(id: any) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    return { post };
  }
}
