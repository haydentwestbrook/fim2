import { IsString, MinLength, MaxLength, Matches, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'The password reset token' })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The new password of the user',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(30, { message: 'Password must not exceed 30 characters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak',
  })
  password: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The confirmed new password of the user',
  })
  @Validate((value: any, args: any) => value === args.object.password, {
    message: 'Passwords do not match',
  })
  confirmPassword: string;
}