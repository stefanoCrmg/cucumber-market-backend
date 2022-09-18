import * as findSymbol from '../../src/handlers/findSymbolHandler'
import * as RTE from 'fp-ts/ReaderTaskEither'
import { genOne } from 'mock-data-gen'
import request from 'supertest'
import { testServer } from '../jestHelpers/mockServerEnv'
import * as fc from 'fast-check'

const mockedCall = jest.spyOn(findSymbol, 'searchSymbolOnFinnhub')

describe('Find symbol on Finnhub', () => {
  test('GET /symbol?identifier=AAPL', async () => {
    await fc.assert(
      fc.asyncProperty(fc.asciiString({ minLength: 1 }), async (propString) => {
        const mockFinnhubSymbolRequst = genOne(findSymbol.SymbolLookup, {
          namedTypeGens: {
            NonEmptyString: (_r) => propString,
          },
        })
        const expectedSymbolResponse = mockFinnhubSymbolRequst
        mockedCall.mockImplementation(() => RTE.right(mockFinnhubSymbolRequst))

        const res = await request(testServer)
          .get('/symbol?identifier=AAPL')
          .expect(200)

        expect(res.body).toEqual(expectedSymbolResponse)
      }),
    )
  })
})
