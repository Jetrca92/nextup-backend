import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { UserService } from './user.service'
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { UserDto } from './dto/user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UpdatePasswordDto } from './dto/update-password.dto'
import { FastifyRequest } from 'fastify'

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'The current user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async findCurrentUser(@GetCurrentUserById() userId: string): Promise<UserDto> {
    return this.userService.getUserById(userId)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({ status: 200, description: 'The updated user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Patch('update-user')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUser(@Body() updateUserDto: UpdateUserDto, @GetCurrentUserById() userId: string): Promise<UserDto> {
    return this.userService.updateUser(userId, updateUserDto)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload event image' })
  @ApiResponse({ status: 201, description: 'Image successfully uploaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post('/upload')
  @HttpCode(HttpStatus.CREATED)
  async uploadEventImage(@GetCurrentUserById() userId: string, @Req() req: FastifyRequest): Promise<UserDto> {
    return this.userService.updateUserImage(userId, req)
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user password' })
  @ApiResponse({ status: 200, description: 'The updated user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Patch('update-password')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @GetCurrentUserById() userId: string,
  ): Promise<UserDto> {
    return this.userService.updatePassword(userId, updatePasswordDto)
  }
}
