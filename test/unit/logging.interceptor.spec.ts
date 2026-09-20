import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('Logs request details on entry and completion', (done) => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/test', id: 'req-1' }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as any;
    const next = {
      handle: () => of('test-response'),
    } as any;

    const loggerSpy = jest.spyOn(interceptor['logger'], 'log');

    interceptor.intercept(mockContext, next).subscribe({
      next: () => {
        expect(loggerSpy).toHaveBeenCalled();
      },
      complete: () => {
        expect(loggerSpy).toHaveBeenCalledTimes(2);
        done();
      },
    });
  });
});
