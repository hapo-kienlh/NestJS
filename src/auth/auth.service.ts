import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { UserRepository } from 'src/users/user.repository';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: UserRepository,
  ) {}

  async loginByUserName(body: any): Promise<any> {
    try {
      const { username, password } = body;

      const user = await this.userRepository.findOne({ where: { username } });

      if (!user) {
        return { status: HttpStatus.UNAUTHORIZED, msg: 'Username Failed' };
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return { status: HttpStatus.UNAUTHORIZED, msg: 'Password Failed' };
      }

      const token = jwt.sign({ user }, 'PRIVATE_KEY_GENERATOR_ACCESS_TOKEN', {
        expiresIn: '1h',
      });

      return {
        status: HttpStatus.OK,
        access_token: token,
        is_login: true,
        message: 'Login Success',
      };
    } catch (error) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, msg: 'Login Failed' };
    }
  }

  async verifyAccessToken(accessToken: string): Promise<any> {
    try {
      const decoded = jwt.verify(
        accessToken,
        'PRIVATE_KEY_GENERATOR_ACCESS_TOKEN',
      );
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }
}
