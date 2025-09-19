import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client'; // Import User from Prisma client
import { Role } from '@prisma/client'; // Import Role from Prisma client
import { LoggerService } from '../common/logger/logger.service';
import { AuthResponseDto } from './dto/auth-response.dto'; // Import AuthResponseDto
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {
    this.logger.setContext(AuthService.name);
  }

  private convertToSeconds(timeStr: string): number {
    if (!timeStr) return 0;
    const lastChar = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1), 10);

    if (isNaN(value)) return parseInt(timeStr, 10) || 0;

    switch (lastChar) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return parseInt(timeStr, 10) || 0;
    }
  }

  /**
   * Registers a new user.
   * @param registerUserDto The data for registering the user.
   * @returns The newly created user.
   * @throws BadRequestException if a user with the given email already exists.
   */
  async register(registerUserDto: RegisterUserDto): Promise<User> {
    this.logger.log(`Attempting to register user: ${registerUserDto.email}`);
    const existingUser = await this.usersService.findByEmail(registerUserDto.email);
    if (existingUser) {
      this.logger.warn(`Registration failed: User with email ${registerUserDto.email} already exists`);
      throw new BadRequestException('User with this email already exists');
    }
    const newUser = await this.usersService.create(registerUserDto);
    this.logger.log(`User registered successfully: ${newUser.email}`);
    return newUser;
  }

  /**
   * Validates a user's credentials.
   * @param email The user's email.
   * @param pass The user's password.
   * @returns The user object (without password) if valid, otherwise null.
   */
  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    this.logger.log(`Attempting to validate user: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`User validation failed: User with email ${email} not found`);
      return null;
    }
    if (!user.isActive) {
      this.logger.warn(`User validation failed: User with email ${email} is inactive`);
      return null;
    }
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`User validation failed: Invalid password for user ${email}`);
      return null;
    }
    const { password, ...result } = user;
    this.logger.log(`User validated successfully: ${email}`);
    return result;
  }

  /**
   * Logs in a user and generates access and refresh tokens.
   * @param loginUserDto The login credentials.
   * @returns An object containing the access token and refresh token.
   * @throws UnauthorizedException if credentials are invalid.
   */
  async login(loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    this.logger.log(`Attempting to log in user: ${loginUserDto.email}`);
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
    if (!user) {
      this.logger.error(`Login failed: Invalid credentials for user ${loginUserDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`User ${user.email} authenticated. Generating tokens.`);

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    const expiresAt = new Date();
    const expiresInDays = parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') || '7');
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    const expiresInStr = this.configService.get<string>('JWT_EXPIRES_IN') || '3600s';
    return {
      id: user.id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accessToken,
      refreshToken,
      expiresIn: this.convertToSeconds(expiresInStr),
    };
  }

  /**
   * Refreshes access and refresh tokens using a valid refresh token.
   * @param refreshToken The refresh token.
   * @returns An object containing new access and refresh tokens.
   * @throws UnauthorizedException if the refresh token is invalid or expired, or user is not found/inactive.
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    this.logger.log('Attempting to refresh tokens.');
    const decoded = this.jwtService.decode(refreshToken);
    if (!decoded || !decoded.sub) {
      this.logger.warn('Refresh token failed: Invalid refresh token format or missing subject.');
      throw new UnauthorizedException('Invalid refresh token');
    }
    this.logger.debug(`Decoded refresh token for user ID: ${decoded.sub}`);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    this.logger.debug(`Stored token found: ${!!storedToken}`);

    if (!storedToken || storedToken.expiresAt < new Date()) {
      this.logger.warn('Refresh token failed: Token not found or expired.');
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    this.logger.debug(`Refresh token is valid. User ID: ${storedToken.userId}`);

    const user = await this.usersService.findOne(storedToken.userId);
    if (!user || !user.isActive) {
      this.logger.warn(`Refresh token failed: User ${storedToken.userId} not found or inactive.`);
      throw new UnauthorizedException('User not found or inactive');
    }
    this.logger.log(`User ${user.email} found for token refresh. Generating new tokens.`);

    const payload = { email: user.email, sub: user.id, role: user.role };
    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    // Invalidate the old refresh token and create a new one within a transaction
    this.logger.debug(`Invalidating old refresh token for user ${user.email} and generating new one.`);
    const { newRefreshToken, expiresAt } = await this.prisma.$transaction(async (prisma) => {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      const newRefreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      });

      const expiresAt = new Date();
      const expiresInDays = parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') || '7');
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: expiresAt,
        },
      });
      return { newRefreshToken, expiresAt };
    });

    this.logger.log(`Tokens refreshed successfully for user ${user.email}`);
    const expiresInStr = this.configService.get<string>('JWT_EXPIRES_IN') || '3600s';
    return {
      id: user.id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.convertToSeconds(expiresInStr),
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    this.logger.log(`Password reset request for: ${forgotPasswordDto.email}`);
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      this.logger.warn(`Password reset request for non-existent user: ${forgotPasswordDto.email}`);
      // Still return a success-like response to prevent user enumeration
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await this.prisma.user.update({
      where: { email: forgotPasswordDto.email },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    this.logger.log(`Generated password reset token for ${user.email}`);

    // In a real application, you would send an email to the user with the resetToken.
    // For this example, we'll just log it.
    this.logger.log(`Password reset token for ${user.email}: ${resetToken}`);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    this.logger.log(`Attempting to reset password with token: ${resetPasswordDto.token}`);

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      this.logger.warn(`Password reset failed: Invalid or expired token provided.`);
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    this.logger.log(`Password for user ${user.email} has been reset successfully.`);
  }

  /**
   * Changes a user's password.
   * @param userId The ID of the user.
   * @param changePasswordDto The change password data.
   * @throws BadRequestException if current password is invalid or new passwords don't match.
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    this.logger.log(`Attempting to change password for user ID: ${userId}`);

    if (changePasswordDto.newPassword !== changePasswordDto.confirmNewPassword) {
      this.logger.warn(`Password change failed: New passwords do not match for user ID ${userId}`);
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Password change failed: User with ID ${userId} not found`);
      throw new BadRequestException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      this.logger.warn(`Password change failed: Invalid current password for user ${user.email}`);
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    this.logger.log(`Password for user ${user.email} has been changed successfully.`);
    return { message: 'Password has been successfully changed.' };
  }
}
