import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { EnvVars } from 'common/constants/env-vars.constant'
import { DatabaseService } from 'modules/database/database.service'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private nodemailerTransport: nodemailer.Transporter

  constructor(
    private prisma: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.nodemailerTransport = nodemailer.createTransport({
      host: this.configService.get<string>(EnvVars.EMAIL_HOST),
      port: this.configService.get<number>(EnvVars.EMAIL_PORT),
      secure: false, // Set to true if using SSL (port 465)
      auth: {
        user: this.configService.get<string>(EnvVars.EMAIL_USER),
        pass: this.configService.get<string>(EnvVars.EMAIL_PASSWORD),
      },
    })
  }

  public async sendResetPasswordLink(email: string): Promise<void> {
    const payload = { email }

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get(EnvVars.JWT_SECRET),
      expiresIn: `${this.configService.get(EnvVars.JWT_SECRET_EXPIRES)}s`,
    })

    const url = `${this.configService.get(EnvVars.EMAIL_RESET_PASSWORD_URL)}?token=${token}`
    const text = `Hi, \nTo reset your password, click here: ${url}`

    return this.sendEmail({
      to: email,
      subject: 'Reset password',
      text,
    })
  }

  private async sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
    await this.nodemailerTransport.sendMail({
      from: this.configService.get<string>(EnvVars.EMAIL_USER),
      to,
      subject,
      text,
    })
  }
}
