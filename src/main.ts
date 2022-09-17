import * as C from 'fp-ts/Console'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/lib/function'
import { exit } from 'process'
import {
  makeServerEnv,
  makeServer,
  observeStartupServerErrors,
} from './makeServer'

const runServer = pipe(
  makeServerEnv,
  TE.map(makeServer),
  TE.orElseFirstIOK(observeStartupServerErrors),
  TE.match(
    () => exit(1),
    (_) => _.listen(3000, C.log('Express listening on port 3000')),
  ),
)

runServer()
