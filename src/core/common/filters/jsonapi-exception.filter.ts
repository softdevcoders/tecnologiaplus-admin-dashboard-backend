import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Response } from 'express';

@Catch(HttpException)
export class JsonApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as
      | string
      | { message?: string | string[]; error?: string; statusCode?: number };

    const messages: string[] = (() => {
      if (typeof exceptionResponse === 'string') return [exceptionResponse];
      if (Array.isArray(exceptionResponse.message))
        return exceptionResponse.message;
      if (typeof exceptionResponse.message === 'string')
        return [exceptionResponse.message];
      if (exceptionResponse.error) return [exceptionResponse.error];
      return ['Unknown error'];
    })();

    const errors = messages.map((msg) => ({
      status: status.toString(),
      title: this.i18n.t(msg) || msg,
    }));

    response.status(status).json({ errors });
  }
}
