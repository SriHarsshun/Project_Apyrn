import { RequestContextMiddleware } from '../../src/common/middleware/request-context.middleware';
import { requestContext } from '../../src/common/context/request-context';

describe('RequestContextMiddleware', () => {
  it('should run next function in context', () => {
    const middleware = new RequestContextMiddleware();
    const req = { headers: {} } as any;
    const res = {} as any;
    let called = false;

    middleware.use(req, res, () => {
      called = true;
      const store = requestContext.getStore();
      expect(store).toBeDefined();
      expect(store?.requestId).toBeDefined();
    });

    expect(called).toBe(true);
  });
});
