import * as findTicker from '../../src/handlers/findTickerHandler'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { genOne } from 'mock-data-gen'
import request from 'supertest'
import { testServer } from '../jestHelpers/mockServerEnv'
import * as fc from 'fast-check'
import { NonEmptyString } from 'io-ts-types'
import { Arbitrary } from 'fast-check'
import * as O from 'fp-ts/Option'

const mockedCall = jest.spyOn(findTicker, 'searchTickerOnPolygon')

const genOptionalNumber: Arbitrary<O.Option<number>> = fc
  .option(fc.nat())
  .map(O.fromNullable)

const genNonEmptyString: Arbitrary<NonEmptyString> = fc.stringOf(
  fc.constantFrom('a', 'b'),
  {
    minLength: 3,
  },
) as Arbitrary<NonEmptyString>

const genOptionalNonEmptyString: Arbitrary<O.Option<NonEmptyString>> = fc
  .option(genNonEmptyString)
  .map(O.fromNullable)

describe('Find Ticker on Polygon', () => {
  test('GET /ticker?search=AAPL', async () => {
    await fc.assert(
      fc.asyncProperty(
        genNonEmptyString,
        genOptionalNonEmptyString,
        genOptionalNumber,
        async (nonEmptyString, optNES, optNumber) => {
          const mockPolygonTickerResponse = genOne(findTicker.TickerResponse, {
            namedTypeGens: {
              NonEmptyString: () => nonEmptyString,
              'Option<number>': () => optNumber,
              'Option<NonEmptyString>': () => optNES,
            },
          })
          mockedCall.mockImplementation(() =>
            RTE.right(mockPolygonTickerResponse),
          )
          const expectedResponse = findTicker.TickerResponse.encode(
            mockPolygonTickerResponse,
          )

          const res = await request(testServer)
            .get('/ticker?search=AAPL')
            .expect(200)

          expect(res.body).toStrictEqual(expectedResponse)
        },
      ),
    )
  })
})
