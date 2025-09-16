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

    return {
      accessToken,
      refreshToken,
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
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
