import '@relmify/jest-fp-ts'
import { NonEmptyString } from 'io-ts-types'
import * as getTickerNews from '../../src/handlers/getTickerNewsHandler'
import * as RTE from 'fp-ts/ReaderTaskEither'
import * as RA from 'fp-ts/ReadonlyArray'
import request from 'supertest'
import { testServer } from '../jestHelpers/mockServerEnv'
import { some } from 'fp-ts/Option'

const mockArticle: getTickerNews.Article = {
  title:
    'Is Google Stock A Buy? Look At These Cloud Numbers First' as NonEmptyString,
  published_utc: new Date('2022-11-11T14:00:00.000Z'),
  article_url:
    'https://seekingalpha.com/article/4556250-is-google-stock-buy-look-these-cloud-numbers-first' as NonEmptyString,
  image_url:
    'https://static.seekingalpha.com/cdn/s3/uploads/getty_images/1194537086/image_1194537086.jpg?io=getty-c-w750' as NonEmptyString,
  description: some(
    'Investors are looking for signs of life, with Alphabet stock down 40% in 2022. Google Cloud is heralded as a potential future profit driver. Read more here.' as NonEmptyString,
  ),
}

const mockTickerNews_ResponseOK: getTickerNews.ArticlesResponse = {
  results: RA.of(mockArticle),
  count: 1,
}

const mockTickerNews_ResponseFail: getTickerNews.ArticlesResponse = {
  results: [],
  count: 0,
}

const spyCandlesRequest = jest.spyOn(getTickerNews, 'getTickerNewsFromPolygon')

describe('Get ticker news from Polygon', () => {
  test('GET /news?ticker=GOOG', async () => {
    spyCandlesRequest.mockImplementation(() =>
      RTE.right(mockTickerNews_ResponseOK),
    )
    const res = await request(testServer).get('/news?ticker=GOOG').expect(200)

    const decodedRes = getTickerNews.ArticlesResponse.decode(res.body)
    expect(decodedRes).toBeRight()
    expect(decodedRes).toStrictEqualRight(mockTickerNews_ResponseOK)
  })

  test('No ticker news from Polygon should result in 404', async () => {
    spyCandlesRequest.mockImplementation(() =>
      RTE.right(mockTickerNews_ResponseFail),
    )
    await request(testServer).get('/news?ticker=GOOG').expect(404)
  })
})
