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
import { AuthGuard } from '@nestjs/passport'
import { GetCurrentUserById } from 'utils/get-user-by-id.decorator'
import { UserDto } from './dto/user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UpdatePasswordDto } from './dto/update-password.dto'
import * as admin from 'firebase-admin'

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private firestore = admin.firestore()

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'The current user', type: UserDto })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ClassSerializerInterceptor)
  async findCurrentUser(@GetCurrentUserById() userId: string): Promise<UserDto> {
    const userDoc = await this.firestore.collection('users').doc(userId).get()

    return {
      id: userDoc.id,
      email: userDoc.data().userData.email,
      firstName: userDoc.data().userData.firstName,
      lastName: userDoc.data().userData.lastName,
    } as UserDto
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
