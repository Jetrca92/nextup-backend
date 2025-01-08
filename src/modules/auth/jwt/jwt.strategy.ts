import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, NotFoundException } from '@nestjs/common'

import { EnvVars } from 'common/constants/env-vars.constant'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { DatabaseService } from 'modules/database/database.service'
import { ConfigService } from '@nestjs/config'
import { User } from '@prisma/client'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: DatabaseService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(EnvVars.JWT_SECRET),
    })
  }

  async validate(payload: JwtPayloadDto): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      throw new NotFoundException(`User not found`)
    }

    return user
  }
}
