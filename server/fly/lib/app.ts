import Client from '../client'

export type ListAppRequest = string

export interface ListAppResponse {
  total_apps: number
  apps: {
    name: string
    machine_count: number
    network: string
  }[]
}

export type GetAppRequest = string

const getAppQuery = `query($name: String!) {
  app(name: $name) {
      name
      status
      organization {
        name
        slug
      }
      ipAddresses {
        nodes {
          type
          region
          address
        }
      }
  }
}`

export enum AppStatus {
  deployed = 'deployed',
  pending = 'pending',
  suspended = 'suspended',
}

export interface AppResponse {
  name: string
  status: AppStatus
  organization: {
    name: string
    slug: string
  }
  ipAddresses: IPAddress[]
}

export interface IPAddress {
  type: string
  address: string
}

export interface CreateAppRequest {
  org_slug: string
  app_name: string
  network?: string
}

export type DeleteAppRequest = string

export class App {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  async listApps(org_slug: ListAppRequest): Promise<ListAppResponse> {
    const path = `apps?org_slug=${org_slug}`
    return await this.client.restOrThrow(path)
  }

  async getApp(app_name: GetAppRequest): Promise<AppResponse> {
    const path = `apps/${app_name}`
    return await this.client.restOrThrow(path)
  }

  async getAppDetailed(app_name: GetAppRequest): Promise<AppResponse> {
    const { app } = await this.client.gqlPostOrThrow({
      query: getAppQuery,
      variables: { name: app_name },
    }) as { app: AppResponse }

    const ipAddresses = app.ipAddresses as unknown as { nodes: IPAddress[] }

    return {
      ...app,
      ipAddresses: ipAddresses.nodes,
    }
  }

  async createApp(payload: CreateAppRequest): Promise<void> {
    const path = 'apps'
    return await this.client.restOrThrow(path, 'POST', payload)
  }

  async deleteApp(app_name: DeleteAppRequest): Promise<void> {
    const path = `apps/${app_name}`
    return await this.client.restOrThrow(path, 'DELETE')
  }
}
