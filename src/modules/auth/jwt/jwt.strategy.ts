import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, NotFoundException } from '@nestjs/common'

import { EnvVars } from 'common/constants/env-vars.constant'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { ConfigService } from '@nestjs/config'
import { UserDto } from 'modules/user/dto/user.dto'
import { DatabaseService } from 'modules/database/database.service'
import { User } from 'models/user.model'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly databaseService: DatabaseService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(EnvVars.JWT_SECRET),
    })
  }

  async validate(payload: JwtPayloadDto): Promise<UserDto> {
    const user = await this.databaseService.findOneById<User>('users', payload.sub)

    if (!user) {
      throw new NotFoundException(`User not found`)
    }
    return user as UserDto
  }
}
