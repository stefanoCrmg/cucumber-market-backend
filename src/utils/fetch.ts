/* adapted from https://github.com/unsplash/request-frp */
import { DecodingFailure } from './../hyper-ts-routing/routeError'
import { formatValidationErrors } from 'io-ts-reporters'
import * as ContentTypeHelpers from 'content-type'
import * as E from 'fp-ts/Either'
import * as IOE from 'fp-ts/IOEither'
import * as IO from '@fp/IO'
import * as C from 'fp-ts/Console'
import * as t from 'io-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import * as RTE from 'fp-ts/ReaderTaskEither'
import {
  Member,
  create,
  _,
  serialize,
  Serialized,
  deserialize,
} from '@unsplash/sum-types'
import { match } from 'ts-pattern'
import { Json } from 'fp-ts/Json'
import { NonEmptyString } from 'io-ts-types'
import { fetch, RequestInfo, RequestInit, Response } from 'undici'
import { LoggerEnv } from 'src/serverEnv'

const CONTENT_TYPE_RESPONSE_HEADER = 'content-type'
const CONTENT_TYPE_JSON = 'application/json'

export type GenericFetchError = Member<'GenericFetchError', { message: string }>
export type FetchError =
  | Member<
      'HttpClientError',
      { statusCode: number; data?: Record<string, unknown> }
    >
  | Member<
      'HttpServerError',
      { statusCode: number; data?: Record<string, unknown> }
    >
  | Member<
      'Unauthorized',
      { statusCode: number; data?: Record<string, unknown> }
    >
  | Member<'NotJson'>
  | Member<'JsonParseError', { message: string }>
  | GenericFetchError
  | DecodingFailure

const {
  mk: { GenericFetchError },
} = create<GenericFetchError>()

const {
  mk: {
    JsonParseError,
    NotJson,
    HttpClientError,
    HttpServerError,
    Unauthorized,
    DecodingFailure,
  },
  match: _matchFetchError,
} = create<FetchError>()

export const matchFetchError = _matchFetchError

export const serializeFetchError: (f: FetchError) => Serialized<FetchError> =
  serialize<FetchError>
export const deserializeFetchError: () => (
  se: Serialized<FetchError>,
) => FetchError = deserialize<FetchError>

export const observeDecodingFailure =
  (additionalInfo?: string) =>
  <A>(someFailure: E.Either<FetchError, A>): IOE.IOEither<FetchError, A> =>
    pipe(
      someFailure,
      IOE.fromEither,
      IOE.orElseFirstIOK(
        flow(
          IO.of,
          IO.chainFirst(() =>
            IO.when(NonEmptyString.is(additionalInfo))(C.log(additionalInfo)),
          ),
          IO.chain(
            _matchFetchError({
              DecodingFailure: ({ errors }) =>
                pipe(errors, formatValidationErrors, C.error),
              [_]: () => constVoid,
            }),
          ),
        ),
      ),
    )

export const fromFetch: (
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
) => TE.TaskEither<GenericFetchError, Response> = TE.tryCatchK(
  fetch,
  flow(
    (error) => (error instanceof Error ? error.message : 'Unknown error.'),
    (message) => GenericFetchError({ message }),
  ),
)

const responseIsJson: (response: Response) => boolean = flow(
  (response: Response) => response.headers.get(CONTENT_TYPE_RESPONSE_HEADER),
  O.fromNullable,
  O.map(flow(ContentTypeHelpers.parse, (result) => result.type)),
  O.exists((type) => type === CONTENT_TYPE_JSON),
)

const responseIs401 = (response: Response): boolean =>
  response.status >= 400 && response.status <= 451
const responseIs40x = (response: Response): boolean =>
  response.status >= 400 && response.status <= 451
const responseIs50x = (response: Response): boolean =>
  response.status >= 500 && response.status <= 511

export const getJson = (response: Response): TE.TaskEither<FetchError, Json> =>
  match(response)
    .when(responseIs401, (r) => TE.left(Unauthorized({ statusCode: r.status })))
    .when(responseIs40x, (r) =>
      TE.left(HttpClientError({ statusCode: r.status })),
    )
    .when(responseIs50x, (r) =>
      TE.left(HttpServerError({ statusCode: r.status })),
    )
    .when(responseIsJson, (r) =>
      TE.tryCatch(
        () => r.json() as Promise<Json>,
        (error) =>
          JsonParseError({
            message: error instanceof Error ? error.message : 'Unknown error.',
          }),
      ),
    )
    .otherwise(() => TE.left(NotJson))

export const getJsonAndValidate =
  <A, O = A>(codec: t.Type<A, O, unknown>) =>
  (response: Response): RTE.ReaderTaskEither<LoggerEnv, FetchError, A> =>
    pipe(
      getJson(response),
      TE.chainEitherK(
        flow(
          codec.decode,
          E.mapLeft((errors) =>
            DecodingFailure({ errors, codecName: codec.name }),
          ),
        ),
      ),
      RTE.fromTaskEither,
      RTE.chainFirstW((res) =>
        pipe(
          RTE.ask<LoggerEnv>(),
          RTE.chainIOK(
            ({ logger }) =>
              () =>
                logger.info({}, `Response OK`),
          ),
        ),
      ),
    )

export const fetchAndValidate =
  <A, O = A>(codec: t.Type<A, O, unknown>, input: RequestInfo | URL) =>
  (
    init?: RequestInit | undefined,
  ): RTE.ReaderTaskEither<LoggerEnv, FetchError, A> =>
    pipe(
      RTE.ask<LoggerEnv>(),
      RTE.chainIOK(
        ({ logger }) =>
          () =>
            logger.info({}, `Requesting ${codec.name} from ${input}`),
      ),
      RTE.chainTaskEitherK(() => fromFetch(input, init)),
      RTE.chain(getJsonAndValidate(codec)),
      RTE.orElseFirstW((err) =>
        pipe(
          RTE.ask<LoggerEnv>(),
          RTE.chainIOK(
            ({ logger }) =>
              () =>
                logger.error(
                  {},
                  `Fetching error: ${JSON.stringify(
                    serialize<FetchError>(err)[0],
                  )}`,
                ),
          ),
        ),
      ),
    )
