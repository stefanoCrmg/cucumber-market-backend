import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import { sendJsonOK } from '../hyper-ts-utilities/responses'
import { RouteHandler } from '../hyper-ts-utilities/routing'

type RouteParams = { readonly userId: string }
export const getAnotherOneHandler = (param: RouteParams): RouteHandler =>
  RM.fromMiddleware(sendJsonOK({ userId: param.userId }))
