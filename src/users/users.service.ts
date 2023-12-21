import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { Readable } from 'stream';
import * as papa from 'papaparse';
import { Repository } from 'typeorm';
import { Post } from 'src/post/post.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private mailerService: MailerService,
  ) {}

  async findAll(user: any): Promise<any> {
    try {
      const listUser = await this.userRepository.find();
      return { current_user: user, list_user: listUser };
    } catch (error) {
      throw new Error('Find User Failed');
    }
  }

  async findById(id: any, currentUser: any): Promise<any> {
    try {
      if (id != currentUser.user.id) {
        return {
          message: 'Only change your information',
          status: HttpStatus.UNAUTHORIZED,
        };
      }

      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['posts'],
      });
      return { user: user };
    } catch (error) {
      throw new Error('Find User Failed');
    }
  }

  async create(user: any): Promise<any> {
    try {
      const { username, password } = user;
      console.log(user);
      const isUser = await this.userRepository.findOne({ where: { username } });
      if (isUser) {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Username already exists',
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;

      await this.userRepository.save(this.userRepository.create(user));

      return {
        status: HttpStatus.OK,
        message: 'Create User Success',
      };
    } catch (error) {
      console.error('Error during user creation:', error);
      throw new Error('Create Failed');
    }
  }

  async delete(payload: any, currentUser: any): Promise<any> {
    try {
      const { id } = payload;
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['posts'],
      });

      if (!user) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'User Not Found',
        };
      }

      if (currentUser?.user?.id != user.id) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: 'Only change your information',
        };
      }

      const { avatar } = user;
      if (avatar) {
        const uploadDir = path.join(__dirname, '../../', 'avatars');
        const existingAvatarPath = path.join(uploadDir, path.basename(avatar));
        fs.unlinkSync(existingAvatarPath);
      }

      await Promise.all(
        user.posts.map((post) => this.postRepository.remove(post)),
      );
      await this.userRepository.remove(user);

      return {
        status: HttpStatus.OK,
        message: 'Delete User Success',
      };
    } catch (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Delete Failed',
      };
    }
  }

  async uploadImage(id: number, image: any, currentUser: any): Promise<any> {
    try {
      const uploadDir = path.join(__dirname, '../../', 'avatars');

      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'User Not Found',
        };
      }

      if (currentUser.user.id != user.id) {
        return {
          status: HttpStatus.FORBIDDEN,
          message: 'Only change your information',
        };
      }
      const { username, avatar } = user;
      const baseUrl = 'http://localhost:3000/avatars/';

      if (avatar) {
        const existingAvatarPath = path.join(uploadDir, path.basename(avatar));
        if (fs.existsSync(existingAvatarPath)) {
          fs.unlinkSync(existingAvatarPath);
        }
      }

      const fileName = `${username}_${Date.now()}${path.extname(
        image?.originalname,
      )}`;

      user.avatar = `${baseUrl}${fileName}`;
      await this.userRepository.save(user);

      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, image.buffer);
      return {
        status: HttpStatus.OK,
        message: 'Upload image success',
      };
    } catch (error) {
      throw new Error('Upload Failed');
    }
  }

  async sendEmail(payload: any, currentUser: any) {
    const { id } = payload;
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user || id != currentUser?.user?.id) {
      return false;
    }

    const newPassword = `${Math.floor(100000 + Math.random() * 900000)}`;
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Send mail by Kiennn 🚀 🚀 🚀 ',
      text: 'HapoSoft',
      html: ` Your new password is: ${newPassword}`,
    });

    return true;
  }

  async createFromCsv(file: any) {
    try {
      const stream = Readable.from(file, { encoding: 'utf-8' });
      let userData: any = {};

      await new Promise<void>((resolve) => {
        papa.parse(stream, {
          header: false,
          worker: true,
          delimiter: ',',
          step: function (row: any) {
            if (row.data && row.data.length === 1) {
              const [property, value] = row.data[0]
                .split(':')
                .map((item: any) => item.trim());
              userData[property] = value;
            }
          },
          complete: function () {
            resolve();
          },
        });
      });

      const username = userData.username;

      const isUser = await this.userRepository.findOne({ where: { username } });
      if (isUser) {
        return false;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      userData.password = hashedPassword;
      await this.userRepository.save(this.userRepository.create(userData));
      return true;
    } catch (error) {
      console.error('Error processing CSV: ', error);
    }
  }
}
