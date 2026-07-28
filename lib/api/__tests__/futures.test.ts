import { ApiClient } from '../../api-client'
import type { FuturesProduct, FuturesPosition, OrderBook } from '@/types/futures'

// Mock fetch globally
global.fetch = jest.fn()

function mockJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response
}

describe('FuturesApi (via ApiClient facade)', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>
  let client: ApiClient

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
    client = new ApiClient('test-token')
  })

  describe('getFuturesProducts', () => {
    it('GETs /api/v1/futures/products with the Bearer header', async () => {
      const products: FuturesProduct[] = [
        {
          id: 'prod-1',
          symbol: 'GRX-SEP26',
          current_price: '4.25',
        } as FuturesProduct,
      ]
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, products))

      const result = await client.getFuturesProducts()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/futures/products'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
      expect(result.status).toBe(200)
      expect(result.data).toEqual(products)
      expect(result.error).toBeUndefined()
    })
  })

  describe('getFuturesPositions', () => {
    it('GETs /api/v1/futures/positions', async () => {
      const positions: FuturesPosition[] = []
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, positions))

      const result = await client.getFuturesPositions()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/futures/positions'),
        expect.objectContaining({ method: 'GET' })
      )
      expect(result.status).toBe(200)
      expect(result.data).toEqual(positions)
    })
  })

  describe('getFuturesOrderBook', () => {
    it('GETs /api/v1/futures/book with product_id as a query param', async () => {
      const book: OrderBook = { bids: [], asks: [] } as unknown as OrderBook
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, book))

      const result = await client.getFuturesOrderBook('prod-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/futures/book?product_id=prod-1'),
        expect.objectContaining({ method: 'GET' })
      )
      expect(result.status).toBe(200)
      expect(result.data).toEqual(book)
    })
  })

  describe('getFuturesCandles', () => {
    it('defaults interval to 1m', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, []))

      await client.getFuturesCandles('prod-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/futures/candles?product_id=prod-1&interval=1m'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('passes an explicit interval through', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, []))

      await client.getFuturesCandles('prod-1', '1h')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('interval=1h'),
        expect.anything()
      )
    })
  })

  describe('createFuturesOrder', () => {
    it('POSTs the order payload to /api/v1/futures/orders', async () => {
      const orderReq = {
        product_id: 'prod-1',
        side: 'buy',
        order_type: 'limit',
        quantity: '10',
        price: '4.20',
        leverage: 5,
      }
      mockFetch.mockResolvedValueOnce(mockJsonResponse(201, { order_id: 'ord-1' }))

      const result = await client.createFuturesOrder(orderReq)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/futures/orders'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(orderReq),
        })
      )
      expect(result.status).toBe(201)
      expect(result.data).toEqual({ order_id: 'ord-1' })
    })
  })

  describe('closeFuturesPosition', () => {
    it('DELETEs /api/v1/futures/positions/:id', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, { order_id: 'ord-close-1' }))

      const result = await client.closeFuturesPosition('pos-9')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/futures/positions/pos-9'),
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(result.data).toEqual({ order_id: 'ord-close-1' })
    })
  })

  describe('error handling', () => {
    it('surfaces a 401 without throwing', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(401, { error: 'unauthorized' }))

      const result = await client.getFuturesProducts()

      expect(result.status).toBe(401)
      expect(result.error).toBe('unauthorized')
      expect(result.data).toBeUndefined()
    })

    it('surfaces a 500 with the server message', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(500, { error: 'internal error' }))

      const result = await client.getFuturesOrderBook('prod-1')

      expect(result.status).toBe(500)
      expect(result.error).toBe('internal error')
      expect(result.data).toBeUndefined()
    })
  })
})
