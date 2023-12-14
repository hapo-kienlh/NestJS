import { ApiProperty } from '@nestjs/swagger';

export class payLoadDto {
  @ApiProperty()
  id: number;
}

export class LoginDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  password: string;
}
