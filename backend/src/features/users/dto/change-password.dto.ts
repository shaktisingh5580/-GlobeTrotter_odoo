import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required.' })
  current_password!: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  new_password!: string;
}
