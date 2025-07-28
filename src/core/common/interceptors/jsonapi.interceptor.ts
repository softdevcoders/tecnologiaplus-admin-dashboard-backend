import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */

interface PaginatedMeta {
  total: number;
  page: number;
  size: number;
}

interface PaginatedBody<T = unknown> {
  data: T[];
  meta: PaginatedMeta;
}

function isPaginatedBody(b: unknown): b is PaginatedBody {
  return (
    typeof b === 'object' &&
    b !== null &&
    'data' in b &&
    Array.isArray(b.data) &&
    'meta' in b &&
    typeof (b.meta as PaginatedMeta).total === 'number'
  );
}

@Injectable()
export class JsonApiInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((body) => {
        // Respeta una respuesta que ya venga formateada como JSON API
        if (
          isPaginatedBody(body) ||
          (body && typeof body === 'object' && 'data' in body)
        ) {
          return body;
        }

        const selfLink = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        // ----------- Colección simple (array) ----------------
        if (Array.isArray(body)) {
          const total = body.length;
          return {
            links: { self: selfLink },
            meta: { total },
            data: body,
          };
        }

        return {
          links: { self: selfLink },
          data: body,
        };
      }),
    );
  }
}
