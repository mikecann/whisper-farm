import Client from '../client'

interface RegionResponse {
  name: string
  code: string
  latitude: number
  longitude: number
  gatewayAvailable: boolean
  requiresPaidPlan: boolean
}

interface PlatformResponse {
  requestRegion: string
  regions: RegionResponse[]
}

export interface GetRegionsOutput {
  platform: PlatformResponse
}

// Ref: https://github.com/superfly/flyctl/blob/master/api/resource_platform.go
const getRegionsQuery = `query {
  platform {
    requestRegion
    regions {
      name
      code
      latitude
      longitude
      gatewayAvailable
      requiresPaidPlan
    }
  }
}`

export class Regions {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  async getRegions(): Promise<GetRegionsOutput> {
    return this.client.gqlPostOrThrow({
      query: getRegionsQuery,
      variables: {},
    })
  }
}
