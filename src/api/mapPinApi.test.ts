import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchMapPins, createMapPin } from './mapPinApi'

function mockFetchOnce(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  }))
}

describe('mapPinApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses both entity-linked and entity-less pins from the public listing', async () => {
    mockFetchOnce([
      {
        id: 'pin-1',
        mapId: 'world-map',
        name: 'Araveth',
        entity: { type: 'CHARACTER', id: 'char-1', name: 'Araveth', status: 'CANON', hidden: false },
        normalizedX: 0.2,
        normalizedY: 0.3,
      },
      {
        id: 'pin-2',
        mapId: 'world-map',
        name: 'Uncharted Ruins',
        entity: null,
        normalizedX: 0.5,
        normalizedY: 0.6,
      },
    ])

    const pins = await fetchMapPins('world-map')

    expect(pins).toHaveLength(2)
    expect(pins[0]).toMatchObject({ id: 'pin-1', name: 'Araveth', entity: { id: 'char-1', name: 'Araveth' } })
    expect(pins[1]).toMatchObject({ id: 'pin-2', name: 'Uncharted Ruins', entity: null })
  })

  it('defaults shape to "default" when omitted from the API response, and passes through "STAR"', async () => {
    mockFetchOnce([
      { id: 'pin-1', mapId: 'world-map', name: 'Araveth', entity: null, normalizedX: 0.2, normalizedY: 0.3 },
      { id: 'pin-2', mapId: 'world-map', name: 'Landmark', entity: null, shape: 'STAR', normalizedX: 0.5, normalizedY: 0.6 },
    ])

    const pins = await fetchMapPins('world-map')

    expect(pins[0].shape).toBe('default')
    expect(pins[1].shape).toBe('star')
  })

  it('omits entityType/entityId from the create request when no entity is linked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({
        id: 'pin-3',
        mapId: 'world-map',
        name: 'Uncharted Ruins',
        entity: null,
        normalizedX: 0.5,
        normalizedY: 0.6,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await createMapPin('world-map', { name: 'Uncharted Ruins', normalizedX: 0.5, normalizedY: 0.6 }, 'token')

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(requestBody).toEqual({ name: 'Uncharted Ruins', normalizedX: 0.5, normalizedY: 0.6 })
    expect(requestBody.entityType).toBeUndefined()
    expect(requestBody.entityId).toBeUndefined()
  })
})
