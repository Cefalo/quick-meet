import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    // todo: add logger instance here
    console.log(`[Incoming Request]: ${method} ${url}`);
    console.log(`[Incoming Cookies]: ${JSON.stringify(request.cookies)}`);

    return next.handle().pipe(
      tap((data) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;

        console.log(`[Outgoing Response]: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - ${JSON.stringify(data)}`);
      }),
    );
  }
}
