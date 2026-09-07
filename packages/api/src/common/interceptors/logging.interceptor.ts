import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id?: string } }>();
    const { method, url } = req;
    const requestId = randomUUID();
    const userId = req.user?.id ?? 'anonymous';
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({ requestId, userId, method, url, status: 200, ms: Date.now() - now }),
        );
      }),
      catchError((err: unknown) => {
        const status = (err as { status?: number })?.status ?? 500;
        const message = (err as { message?: string })?.message ?? 'Internal error';
        this.logger.error(
          JSON.stringify({ requestId, userId, method, url, status, message, ms: Date.now() - now }),
        );
        return throwError(() => err);
      }),
    );
  }
}
