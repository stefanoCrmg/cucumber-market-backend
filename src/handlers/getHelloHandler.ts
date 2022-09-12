import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import { sendJsonOK } from '../hyper-ts-utilities/responses'
import { RouteHandler } from '../hyper-ts-utilities/routing'

export const getHelloHandler: RouteHandler = RM.fromMiddleware(
  sendJsonOK({ ok: true }),
)
