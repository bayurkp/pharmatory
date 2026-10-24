import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app.js'
import { closeDatabase } from '../../src/db/connection.js'

describe('Pharmatory API Integration Tests (Fastify inject)', () => {
  let app: FastifyInstance

  before(async () => {
    app = await buildApp({ logger: false })
  })

  after(async () => {
    await app.close()
    closeDatabase()
  })

  it('GET /api/health - returns 200 with ByJSON success envelope', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.error, null)
    assert.ok(json.meta.requestId)
    assert.ok(json.meta.timestamp)
    assert.equal(json.data.status, 'healthy')
  })

  it('GET /api/v1/products - retrieves full catalog conforming to ByJSON', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/products'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.ok(Array.isArray(json.data))
    assert.equal(json.data.length, 5)

    const hepB = json.data.find((p: { id: string }) => p.id === 'P002')
    assert.ok(hepB)
    assert.equal(hepB.requiresColdChain, true)
    assert.equal(hepB.category, 'pharmaceutical')
  })

  it('GET /api/v1/products?requiresColdChain=true - filters by query parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/products?requiresColdChain=true'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.data.length, 2)
    assert.ok(json.data.every((p: { requiresColdChain: boolean }) => p.requiresColdChain === true))
  })

  it('GET /api/v1/products?coldChain=true - filters by concise camelCase parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/products?coldChain=true'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.data.length, 2)
  })

  it('GET /api/v1/products?cold_chain=true - filters by concise snake_case parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/products?cold_chain=true'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.data.length, 2)
  })

  it('GET /api/v1/warehouses - retrieves all 8 warehouses and inventory', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/warehouses'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.ok(Array.isArray(json.data))
    assert.equal(json.data.length, 8)

    const w04 = json.data.find((w: { id: string }) => w.id === 'W04')
    assert.ok(w04)
    assert.equal(w04.isColdChainCapable, true)
    assert.equal(w04.fleetType, 'refrigerated')
    assert.equal(w04.storageType, 'refrigerated')
  })

  it('GET /api/v1/warehouses?location=Surabaya - filters warehouses by location', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/warehouses?location=Surabaya'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.data.length, 2)
    assert.ok(json.data.every((w: { location: string }) => w.location === 'Surabaya'))
  })

  it('GET /api/v1/warehouses?city=Gresik&cold_chain=true - filters by concise parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/warehouses?city=Gresik&cold_chain=true'
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    // W04 in Gresik is full cold-chain capable (refrigerated storage + refrigerated vans)
    assert.equal(json.data.length, 1)
    assert.equal(json.data[0].id, 'W04')
  })

  it('POST /api/v1/orders/fulfill - successfully fulfills single-origin order', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/fulfill',
      payload: {
        items: [
          { productId: 'P001', quantity: 20 },
          { productId: 'P003', quantity: 50 }
        ],
        orderTime: 'Mon, 14:00'
      }
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.data.strategy, 'single_warehouse')
    assert.equal(json.data.shipments[0].warehouseId, 'W01')
    assert.ok(json.data.explanation)
    assert.equal(json.meta.requestId.length, 36)
  })

  it('POST /api/v1/fulfillments - supports ByJSON Section 3.1 resource-oriented alias', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/fulfillments',
      payload: {
        destinationCity: 'Surabaya',
        items: [{ productId: 'P001', quantity: 20 }],
        orderTime: 'Mon, 14:00'
      }
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.data.strategy, 'single_warehouse')
  })

  it('POST /api/v1/orders/fulfill - returns 422 with ByJSON error details when payload schema is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/fulfill',
      payload: {
        items: [
          { productId: 'P001', quantity: 0 } // invalid: minimum is 1
        ]
      }
    })

    assert.equal(response.statusCode, 422)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, false)
    assert.equal(json.data, null)
    assert.equal(json.error.code, 'validation_error')
    assert.ok(Array.isArray(json.error.details))
    assert.ok(json.error.details.length > 0)
    assert.equal(json.error.details[0].code, 'minimum')
  })

  it('POST /api/v1/traffic/upload - parses and loads custom CSV in-memory without disk writes', async () => {
    const boundary = '----CustomBoundary12345'
    const csvContent = [
      'Delivery ID,Warehouse,Day/Time,Actual Duration (minutes),Notes',
      'DL991,W01,"Mon, 08:00",42,In-memory custom delivery test',
      'DL992,W04,"Tue, 10:00",35,Cold chain test delivery'
    ].join('\r\n')

    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="custom_test.csv"',
      'Content-Type: text/csv',
      '',
      csvContent,
      `--${boundary}--`
    ].join('\r\n')

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/traffic/upload',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      payload
    })

    assert.equal(response.statusCode, 200)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, true)
    assert.equal(json.data.processedRecords, 2)
    assert.equal(json.data.filename, 'custom_test.csv')

    // Reset back to benchmark dataset for subsequent tests
    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/v1/traffic/reset'
    })
    assert.equal(resetRes.statusCode, 200)
  })

  it('POST /api/v1/traffic/upload - returns 422 unsupported_file_type for non-csv files', async () => {
    const boundary = '----CustomBoundaryImage'
    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="photo.jpg"',
      'Content-Type: image/jpeg',
      '',
      'binary-data-here',
      `--${boundary}--`
    ].join('\r\n')

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/traffic/upload',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      payload
    })

    assert.equal(response.statusCode, 422)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'unsupported_file_type')
  })

  it('GET /api/v1/non-existent-route - returns 404 with ByJSON format', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/non-existent-route'
    })

    assert.equal(response.statusCode, 404)
    const json = JSON.parse(response.payload)
    assert.equal(json.success, false)
    assert.equal(json.error.code, 'not_found')
    assert.ok(json.meta.requestId)
  })

  it('GET /docs - redirects to /docs/v1 with 302', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs'
    })

    assert.equal(response.statusCode, 302)
    assert.equal(response.headers.location, '/docs/v1')
  })

  it('GET /api/health - applies defensive security headers (Helmet)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health'
    })

    assert.equal(response.statusCode, 200)
    assert.equal(response.headers['x-content-type-options'], 'nosniff')
    assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN')
  })
})
