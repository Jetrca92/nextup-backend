import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UserLoginDto } from './dto/user-login.dto'
import { UserDto } from '../user/dto/user.dto'
import { UserRegisterDto } from './dto/user-register.dto'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { ConfigService } from '@nestjs/config'
import { EnvVars } from 'common/constants/env-vars.constant'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { FastifyReply } from 'fastify'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Post('register')
  async register(@Body() dto: UserRegisterDto): Promise<UserDto> {
    return this.authService.register(dto)
  }

  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.', type: String })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post('login')
  async login(@Body() dto: UserLoginDto): Promise<{ access_token: string }> {
    const user: UserDto = await this.authService.validateUser(dto.email, dto.password)
    return this.authService.login(user)
  }

  @ApiOperation({ summary: 'Redirect to Google for login' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {}

  @ApiOperation({ summary: 'Google login callback' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: any, res: FastifyReply) {
    const { access_token } = await this.authService.login(req.user)
    const baseUrl = this.configService.get<string>(EnvVars.DATABASE_HOST)
    return res.redirect(`http://${baseUrl}:8080/dashboard?token=${access_token}`)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  @ApiResponse({ status: 400, description: 'Invalid email address.' })
  @UseGuards(AuthGuard('jwt'))
  @Post('forgot-password')
  async forgotPassword(@GetCurrentUserById() userId: string): Promise<void> {
    return this.authService.forgotPassword(userId)
  }
}
