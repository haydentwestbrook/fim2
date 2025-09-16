import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoggerService } from '../common/logger/logger.service';
import { AuthResponseDto } from './dto/auth-response.dto'; // Import AuthResponseDto

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid input or email already exists.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    this.logger.log(`Received registration request for email: ${registerUserDto.email}`);
    const result = await this.authService.register(registerUserDto);
    this.logger.log(`Registration successful for email: ${registerUserDto.email}`);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user and get JWT tokens' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid credentials.' })
  async login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    this.logger.log(`Received login request for email: ${loginUserDto.email}`);
    const result = await this.authService.login(loginUserDto);
    this.logger.log(`Login successful for email: ${loginUserDto.email}`);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Access token successfully refreshed.', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or expired refresh token.' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    this.logger.log('Received refresh token request.');
    const result = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    this.logger.log('Tokens refreshed successfully.');
    return result;
  }
}
