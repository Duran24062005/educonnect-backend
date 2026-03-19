import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type AsyncRequestHandler<
    Req extends Request = Request,
    Res extends Response = Response,
> = (req: Req, res: Res, next: NextFunction) => Promise<unknown>;

export type TypedRequestHandler<
    Req extends Request = Request,
    Res extends Response = Response,
> = RequestHandler<
    Req['params'],
    unknown,
    Req['body'],
    Req['query']
>;

