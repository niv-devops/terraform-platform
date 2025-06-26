export interface TerraformResource {
  id: string
  name: string
  type: string
  module?: string
  dependencies?: string[]
  attributes?: Record<string, any>
}

export interface TerraformModule {
  name: string
  path: string
  resources: TerraformResource[]
}

export interface TerraformProvider {
  name: string
  version: string
}

export interface TerraformState {
  version: number
  terraform_version: string
  serial: number
  lineage: string
  resources: TerraformResource[]
  modules: TerraformModule[]
  providers: TerraformProvider[]
}

// Terraform Plan types

export interface ResourceChange {
  address: string
  type: string
  name: string
  provider: string
  action: "create" | "update" | "delete" | "read" | "no-op"
  beforeValues: Record<string, any> | null
  afterValues: Record<string, any> | null
  module: string | null
}

export interface PlanSummary {
  add: number
  change: number
  destroy: number
  total: number
}

export interface TerraformPlan {
  format_version: string
  terraform_version: string
  resourceChanges: ResourceChange[]
  summary: PlanSummary
  rawPlan: any
}

// Cost Estimation types

export interface CostEstimate {
  resourceAddress: string
  resourceType: string
  resourceName: string
  provider: string
  instanceType?: string
  monthlyCost: number
  hourlyCost: number
  details: string
  confidence: "high" | "medium" | "low"
}

export interface CostSummary {
  totalMonthlyCost: number
  totalHourlyCost: number
  resourceCount: number
  estimates: CostEstimate[]
  breakdown: {
    compute: number
    storage: number
    network: number
    database: number
    other: number
  }
}

export interface CostComparison {
  current: CostSummary
  planned: CostSummary
  difference: {
    monthly: number
    percentage: number
  }
  changedResources: {
    added: CostEstimate[]
    removed: CostEstimate[]
    modified: CostEstimate[]
  }
}
