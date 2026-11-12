import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

/**
 * Global cache invalidation: after any successful mutating request (POST/
 * PATCH/DELETE), bump the requesting user's cache epoch so cached reads
 * (dashboard/reports/notifications) are refreshed on their next fetch.
 */
@Injectable()
export class CacheBumpInterceptor implements NestInterceptor {
  constructor(private cache: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest();
    if (request.method === 'GET') return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          const userId = request.user?.id ?? request.user?.userId;
          if (userId) this.cache.bumpUser(userId);
        },
      }),
    );
  }
}
