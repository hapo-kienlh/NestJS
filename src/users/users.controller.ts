import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { payLoadDto } from 'src/DTO';



class payLoadCreateDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  email: string;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiHeader({
    name: 'Token',
    required: true,
  })
  getUsers(@Req() req: any): any {
    const user = req.user;
    return this.usersService.findAll(user);
  }

  @Get(':id')
  @ApiHeader({
    name: 'Token',
    required: true,
  })
  getUserById(@Req() req: any, @Param('id') id: number): any {
    const currentUser = req.user;
    return this.usersService.findById(id, currentUser);
  }

  @Post('create')
  @ApiHeader({
    name: 'Token',
    required: true,
  })
  @ApiBody({ type: payLoadCreateDto })
  create(
    @Body() body: { username: string; email: string; password: string },
  ): any {
    return this.usersService.create(body);
  }

  @Delete('delete')
  @ApiHeader({
    name: 'Token',
    required: true,
  })
  @ApiBody({ type: payLoadDto })
  delete(@Body() body: { id: string }, @Req() req: any): any {
    const currentUser = req.user;
    return this.usersService.delete(body, currentUser);
  }

  @Post(':id/upload-image')
  @ApiHeader({
    name: 'Token',
    required: true,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  // @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() image: any,
    @Param('id') id: number,
    @Req() req,
  ): Promise<any> {
    const currentUser = req.user;
    return this.usersService.uploadImage(id, image, currentUser);
  }

  @Post('send-email')
  @ApiHeader({
    name: 'Token',
    required: true,
  })
  @ApiBody({ type: payLoadDto })
  async sendEmail(@Body() payload: any, @Req() req: any) {
    const currentUser = req.user;
    const isSendMail = await this.usersService.sendEmail(payload, currentUser);
    if (!isSendMail) {
      return {
        message: 'Send mail Failed',
        status: HttpStatus.BAD_REQUEST,
      };
    } else {
      return {
        message: `Password change success, please to your gmail: ${currentUser?.user?.email} `,
        status: HttpStatus.OK,
      };
    }
  }

  @Post('create/from-csv')
  @ApiHeader({
    name: 'Token',
    required: true,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file) {
    try {
      const isCreate = await this.usersService.createFromCsv(file.buffer);

      if (isCreate) {
        return {
          message: 'Create user from csv file Success',
          status: HttpStatus.OK,
        };
      } else {
        return {
          message: 'Username already exists',
          status: HttpStatus.BAD_REQUEST,
        };
      }
    } catch (error) {
      throw new HttpException(
        'An error occurred during processing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
