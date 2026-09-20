import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password (min 8 characters)', example: 'strongPassword123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ description: 'Company name to create on registration', example: 'Acme Corp' })
  @IsString()
  companyName!: string;
}
