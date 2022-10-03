import { unwrapPolygonApiKey } from './../serverEnv'
import { pipe } from 'fp-ts/lib/function'
import { PolygonEnv, LoggerEnv } from 'src/serverEnv'
import { RequestInit } from 'undici'
import * as RTE from 'fp-ts/ReaderTaskEither'

export const fetchFromPolygon = <E, A>(
  fetchTask: (
    init?: RequestInit | undefined,
  ) => RTE.ReaderTaskEither<LoggerEnv & PolygonEnv, E, A>,
): RTE.ReaderTaskEither<LoggerEnv & PolygonEnv, E, A> =>
  RTE.asksReaderTaskEither(({ polygonApiKey }) =>
    pipe(
      fetchTask({
        headers: {
          Authorization: `Bearer ${unwrapPolygonApiKey(polygonApiKey.main)}`,
        },
      }),
      RTE.alt(() =>
        fetchTask({
          headers: {
            Authorization: `Bearer ${unwrapPolygonApiKey(
              polygonApiKey.backup,
            )}`,
          },
        }),
      ),
    ),
  )
