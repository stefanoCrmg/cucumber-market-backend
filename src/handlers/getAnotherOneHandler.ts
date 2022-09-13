import { Status } from 'hyper-ts'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import { sendJson } from '../hyper-ts-utilities/responses'
import { RouteHandler } from '../hyper-ts-utilities/routing'

type RouteParams = { readonly userId: string }
export const getAnotherOneHandler = (param: RouteParams): RouteHandler =>
  RM.fromMiddleware(sendJson(Status.OK, { userId: param.userId }))
