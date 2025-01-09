import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, NotFoundException } from '@nestjs/common'

import { EnvVars } from 'common/constants/env-vars.constant'
import { JwtPayloadDto } from 'modules/auth/dto/jwt-payload.dto'
import { ConfigService } from '@nestjs/config'
import { Firestore } from '@google-cloud/firestore'
import { UserFirestore } from '../dto/user-firestore.dto'
import { UserDto } from 'modules/user/dto/user.dto'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private usersCollection

  constructor(
    private readonly firestore: Firestore,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(EnvVars.JWT_SECRET),
    })
    this.usersCollection = firestore.collection('users')
  }

  async validate(payload: JwtPayloadDto): Promise<UserDto> {
    const userRef = this.usersCollection.doc(payload.sub)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      throw new NotFoundException(`User not found`)
    }

    const userData = userSnapshot.data() as UserFirestore
    const user: UserDto = {
      id: userRef.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      avatarUrl: userData.avatarUrl,
    }

    return user
  }
}
