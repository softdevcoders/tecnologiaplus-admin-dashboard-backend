import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';

interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  label?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;

  constructor(private readonly config: ConfigService) {
    void this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('GMAIL_USER'),
        pass: this.config.get<string>('GMAIL_APP_PASSWORD'),
      },
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.transporter.verify();
      this.logger.log('Mail transporter ready');
    } catch (err) {
      this.logger.error('Mail transporter error', err);
    }
  }

  async send(options: SendMailOptions): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.transporter.sendMail({
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Failed to send ${options.label || 'email'} to ${options.to}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to send ${options.label || 'email'}`);
    }
  }

  async sendActivationEmail(email: string, token: string): Promise<void> {
    const activationLink = `${this.config.get<string>('APP_URL')}/activate?token=${token}`;
    const html = `
      <p>Click the link to activate your account:</p>
      <p><a href="${activationLink}">${activationLink}</a></p>`;

    await this.send({
      to: email,
      subject: 'Account activation',
      html,
      label: 'Activation',
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `${this.config.get<string>('APP_URL')}/reset-password?token=${token}`;
    const html = `<p>Reset password link:</p><p><a href="${link}">${link}</a></p>`;
    await this.send({
      to: email,
      subject: 'Password reset',
      html,
      label: 'PasswordReset',
    });
  }
}
