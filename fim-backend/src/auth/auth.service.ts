import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './decorators/roles.decorator';
import { LoggerService } from '../common/logger/logger.service';

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

  async register(registerUserDto: RegisterUserDto) {
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

  async validateUser(email: string, pass: string): Promise<any> {
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

  async login(loginUserDto: LoginUserDto) {
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

  async refreshTokens(refreshToken: string) {
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

    // Invalidate the old refresh token and create a new one (optional, but good practice)
    this.logger.debug(`Invalidating old refresh token for user ${user.email}`);
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
    this.logger.debug(`Old refresh token invalidated. Generating new refresh token for user ${user.email}`);

    const newRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    const expiresAt = new Date();
    const expiresInDays = parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') || '7');
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    this.logger.log(`Tokens refreshed successfully for user ${user.email}`);
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
