import { Status } from 'hyper-ts'
import * as RM from 'hyper-ts/lib/ReaderMiddleware'
import { sendJson } from '../hyper-ts-routing/responses'
import { RouteHandler } from '../hyper-ts-routing/routing'

type RouteParams = { readonly userId: string }
export const getAnotherOneHandler = (param: RouteParams): RouteHandler =>
  RM.fromMiddleware(sendJson(Status.OK, { userId: param.userId }))
