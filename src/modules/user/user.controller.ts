import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { UserService } from './user.service'
import { DatabaseService } from 'modules/database/database.service'
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { UserDto } from './dto/user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UpdatePasswordDto } from './dto/update-password.dto'

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private prisma: DatabaseService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'The current user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async findCurrentUser(@GetCurrentUserById() userId: string): Promise<UserDto> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    })
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({ status: 200, description: 'The updated user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Patch('/update-user')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUser(@Body() updateUserDto: UpdateUserDto, @GetCurrentUserById() userId: string): Promise<UserDto> {
    return this.userService.updateUser(userId, updateUserDto)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user password' })
  @ApiResponse({ status: 200, description: 'The updated user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Patch('/update-password')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetCurrentUserById() userId: string,
  ): Promise<UserDto> {
    return this.userService.updatePassword(userId, updatePasswordDto)
  }
}
