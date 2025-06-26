import type { TerraformState, TerraformPlan } from "./types"

// AWS pricing data (simplified - in production, you'd use AWS Pricing API)
const AWS_PRICING: Record<string, any> = {
  aws_instance: {
    "t2.micro": { hourly: 0.0116, monthly: 8.47 },
    "t2.small": { hourly: 0.023, monthly: 16.79 },
    "t2.medium": { hourly: 0.0464, monthly: 33.87 },
    "t3.micro": { hourly: 0.0104, monthly: 7.59 },
    "t3.small": { hourly: 0.0208, monthly: 15.18 },
    "t3.medium": { hourly: 0.0416, monthly: 30.37 },
    "m5.large": { hourly: 0.096, monthly: 70.08 },
    "m5.xlarge": { hourly: 0.192, monthly: 140.16 },
    "c5.large": { hourly: 0.085, monthly: 62.05 },
    "r5.large": { hourly: 0.126, monthly: 91.98 },
  },
  aws_rds_instance: {
    "db.t3.micro": { hourly: 0.017, monthly: 12.41 },
    "db.t3.small": { hourly: 0.034, monthly: 24.82 },
    "db.t3.medium": { hourly: 0.068, monthly: 49.64 },
    "db.r5.large": { hourly: 0.24, monthly: 175.2 },
    "db.r5.xlarge": { hourly: 0.48, monthly: 350.4 },
  },
  aws_s3_bucket: {
    standard: { per_gb_monthly: 0.023 },
    ia: { per_gb_monthly: 0.0125 },
    glacier: { per_gb_monthly: 0.004 },
  },
  aws_ebs_volume: {
    gp2: { per_gb_monthly: 0.1 },
    gp3: { per_gb_monthly: 0.08 },
    io1: { per_gb_monthly: 0.125 },
    io2: { per_gb_monthly: 0.125 },
  },
  aws_lb: {
    application: { hourly: 0.0225, monthly: 16.43 },
    network: { hourly: 0.0225, monthly: 16.43 },
  },
  aws_nat_gateway: {
    default: { hourly: 0.045, monthly: 32.85 },
  },
  aws_vpc_endpoint: {
    interface: { hourly: 0.01, monthly: 7.3 },
    gateway: { monthly: 0 }, // Gateway endpoints are free
  },
}

// GCP pricing data (simplified but comprehensive for GKE)
const GCP_PRICING: Record<string, any> = {
  // Compute Engine instances (used by GKE nodes)
  google_compute_instance: {
    "e2-micro": { hourly: 0.008, monthly: 5.84 },
    "e2-small": { hourly: 0.0168, monthly: 12.26 },
    "e2-medium": { hourly: 0.0336, monthly: 24.53 },
    "e2-standard-2": { hourly: 0.0672, monthly: 49.06 },
    "e2-standard-4": { hourly: 0.1344, monthly: 98.11 },
    "n1-standard-1": { hourly: 0.0475, monthly: 34.68 },
    "n1-standard-2": { hourly: 0.095, monthly: 69.35 },
    "n1-standard-4": { hourly: 0.19, monthly: 138.7 },
    "n2-standard-2": { hourly: 0.097, monthly: 70.81 },
    "n2-standard-4": { hourly: 0.194, monthly: 141.62 },
    "n2-standard-8": { hourly: 0.388, monthly: 283.24 },
    "c2-standard-4": { hourly: 0.1687, monthly: 123.15 },
    "c2-standard-8": { hourly: 0.3374, monthly: 246.3 },
    "c2-standard-16": { hourly: 0.6748, monthly: 492.6 },
  },

  // GKE clusters
  google_container_cluster: {
    zonal: { hourly: 0.1, monthly: 73.0 }, // GKE management fee
    regional: { hourly: 0.1, monthly: 73.0 }, // Same fee for regional
    autopilot: { hourly: 0.1, monthly: 73.0 }, // Autopilot management fee
  },

  // GKE node pools (inherits compute pricing)
  google_container_node_pool: {
    "e2-medium": { hourly: 0.0336, monthly: 24.53 },
    "e2-standard-2": { hourly: 0.0672, monthly: 49.06 },
    "e2-standard-4": { hourly: 0.1344, monthly: 98.11 },
    "n1-standard-1": { hourly: 0.0475, monthly: 34.68 },
    "n1-standard-2": { hourly: 0.095, monthly: 69.35 },
    "n1-standard-4": { hourly: 0.19, monthly: 138.7 },
    "n2-standard-2": { hourly: 0.097, monthly: 70.81 },
    "n2-standard-4": { hourly: 0.194, monthly: 141.62 },
    "c2-standard-4": { hourly: 0.1687, monthly: 123.15 },
  },

  // Persistent disks
  google_compute_disk: {
    "pd-standard": { per_gb_monthly: 0.04 },
    "pd-balanced": { per_gb_monthly: 0.1 },
    "pd-ssd": { per_gb_monthly: 0.17 },
    "pd-extreme": { per_gb_monthly: 0.125 }, // Base price, varies by IOPS
  },

  // Cloud SQL
  google_sql_database_instance: {
    "db-f1-micro": { hourly: 0.015, monthly: 10.95 },
    "db-g1-small": { hourly: 0.05, monthly: 36.5 },
    "db-n1-standard-1": { hourly: 0.0825, monthly: 60.23 },
    "db-n1-standard-2": { hourly: 0.165, monthly: 120.45 },
    "db-n1-standard-4": { hourly: 0.33, monthly: 240.9 },
    "db-n1-highmem-2": { hourly: 0.1975, monthly: 144.18 },
    "db-n1-highmem-4": { hourly: 0.395, monthly: 288.35 },
  },

  // Cloud Storage
  google_storage_bucket: {
    standard: { per_gb_monthly: 0.02 },
    nearline: { per_gb_monthly: 0.01 },
    coldline: { per_gb_monthly: 0.004 },
    archive: { per_gb_monthly: 0.0012 },
  },

  // Load Balancers
  google_compute_global_forwarding_rule: {
    http_https: { hourly: 0.025, monthly: 18.25 },
  },

  google_compute_forwarding_rule: {
    network: { hourly: 0.025, monthly: 18.25 },
    internal: { hourly: 0.025, monthly: 18.25 },
  },

  // VPC and Networking
  google_compute_router: {
    default: { hourly: 0.015, monthly: 10.95 },
  },

  google_compute_router_nat: {
    default: { hourly: 0.045, monthly: 32.85 },
  },

  // Cloud DNS
  google_dns_managed_zone: {
    default: { monthly: 0.2 }, // First 25 zones free, then $0.20/zone
  },

  // Filestore (NFS)
  google_filestore_instance: {
    basic_hdd: { per_gb_monthly: 0.2 },
    basic_ssd: { per_gb_monthly: 0.3 },
    high_scale_ssd: { per_gb_monthly: 0.6 },
  },
}

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

/**
 * Estimate costs for current Terraform state
 */
export function estimateCurrentStateCosts(state: TerraformState): CostSummary {
  const estimates: CostEstimate[] = []

  state.resources.forEach((resource) => {
    const estimate = estimateResourceCost(resource.type, resource.attributes || {}, resource.name)
    if (estimate) {
      estimates.push({
        ...estimate,
        resourceAddress: `${resource.type}.${resource.name}`,
        resourceName: resource.name,
      })
    }
  })

  return calculateCostSummary(estimates)
}

/**
 * Estimate costs for planned Terraform changes
 */
export function estimatePlannedStateCosts(plan: TerraformPlan, currentState?: TerraformState): CostComparison {
  const currentCosts = currentState
    ? estimateCurrentStateCosts(currentState)
    : {
        totalMonthlyCost: 0,
        totalHourlyCost: 0,
        resourceCount: 0,
        estimates: [],
        breakdown: { compute: 0, storage: 0, network: 0, database: 0, other: 0 },
      }

  const plannedEstimates: CostEstimate[] = []
  const addedResources: CostEstimate[] = []
  const removedResources: CostEstimate[] = []
  const modifiedResources: CostEstimate[] = []

  // Start with current resources
  const plannedResourceMap = new Map<string, CostEstimate>()
  currentCosts.estimates.forEach((estimate) => {
    plannedResourceMap.set(estimate.resourceAddress, estimate)
  })

  // Process plan changes
  plan.resourceChanges.forEach((change) => {
    const resourceKey = change.address

    if (change.action === "create") {
      const estimate = estimateResourceCost(change.type, change.afterValues || {}, change.name)
      if (estimate) {
        const fullEstimate = {
          ...estimate,
          resourceAddress: change.address,
          resourceName: change.name,
        }
        plannedResourceMap.set(resourceKey, fullEstimate)
        addedResources.push(fullEstimate)
      }
    } else if (change.action === "delete") {
      const existingEstimate = plannedResourceMap.get(resourceKey)
      if (existingEstimate) {
        plannedResourceMap.delete(resourceKey)
        removedResources.push(existingEstimate)
      }
    } else if (change.action === "update") {
      const estimate = estimateResourceCost(change.type, change.afterValues || {}, change.name)
      if (estimate) {
        const fullEstimate = {
          ...estimate,
          resourceAddress: change.address,
          resourceName: change.name,
        }
        plannedResourceMap.set(resourceKey, fullEstimate)
        modifiedResources.push(fullEstimate)
      }
    }
  })

  const plannedCosts = calculateCostSummary(Array.from(plannedResourceMap.values()))

  return {
    current: currentCosts,
    planned: plannedCosts,
    difference: {
      monthly: plannedCosts.totalMonthlyCost - currentCosts.totalMonthlyCost,
      percentage:
        currentCosts.totalMonthlyCost > 0
          ? ((plannedCosts.totalMonthlyCost - currentCosts.totalMonthlyCost) / currentCosts.totalMonthlyCost) * 100
          : 0,
    },
    changedResources: {
      added: addedResources,
      removed: removedResources,
      modified: modifiedResources,
    },
  }
}

/**
 * Estimate cost for a single resource
 */
function estimateResourceCost(
  resourceType: string,
  attributes: Record<string, any>,
  resourceName: string,
): Omit<CostEstimate, "resourceAddress" | "resourceName"> | null {
  const provider = getProviderFromResourceType(resourceType)

  switch (provider) {
    case "aws":
      return estimateAWSResourceCost(resourceType, attributes)
    case "google":
      return estimateGCPResourceCost(resourceType, attributes)
    default:
      return null
  }
}

/**
 * Estimate AWS resource costs
 */
function estimateAWSResourceCost(
  resourceType: string,
  attributes: Record<string, any>,
): Omit<CostEstimate, "resourceAddress" | "resourceName"> | null {
  switch (resourceType) {
    case "aws_instance": {
      const instanceType = attributes.instance_type || "t3.micro"
      const pricing = AWS_PRICING.aws_instance[instanceType]

      if (!pricing) {
        return {
          resourceType,
          provider: "aws",
          instanceType,
          monthlyCost: 20, // Default estimate
          hourlyCost: 0.027,
          details: `Unknown instance type: ${instanceType}`,
          confidence: "low",
        }
      }

      return {
        resourceType,
        provider: "aws",
        instanceType,
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: `EC2 instance ${instanceType}`,
        confidence: "high",
      }
    }

    case "aws_rds_instance": {
      const instanceClass = attributes.instance_class || "db.t3.micro"
      const pricing = AWS_PRICING.aws_rds_instance[instanceClass]

      if (!pricing) {
        return {
          resourceType,
          provider: "aws",
          instanceType: instanceClass,
          monthlyCost: 25,
          hourlyCost: 0.034,
          details: `Unknown RDS instance class: ${instanceClass}`,
          confidence: "low",
        }
      }

      return {
        resourceType,
        provider: "aws",
        instanceType: instanceClass,
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: `RDS instance ${instanceClass}`,
        confidence: "high",
      }
    }

    case "aws_ebs_volume": {
      const volumeType = attributes.type || "gp3"
      const size = Number.parseInt(attributes.size) || 20
      const pricing = AWS_PRICING.aws_ebs_volume[volumeType]

      if (!pricing) {
        return {
          resourceType,
          provider: "aws",
          monthlyCost: size * 0.08,
          hourlyCost: (size * 0.08) / 730,
          details: `Unknown EBS volume type: ${volumeType}`,
          confidence: "low",
        }
      }

      const monthlyCost = size * pricing.per_gb_monthly
      return {
        resourceType,
        provider: "aws",
        monthlyCost,
        hourlyCost: monthlyCost / 730,
        details: `EBS ${volumeType} volume ${size}GB`,
        confidence: "high",
      }
    }

    case "aws_lb": {
      const loadBalancerType = attributes.load_balancer_type || "application"
      const pricing = AWS_PRICING.aws_lb[loadBalancerType]

      return {
        resourceType,
        provider: "aws",
        monthlyCost: pricing?.monthly || 16.43,
        hourlyCost: pricing?.hourly || 0.0225,
        details: `${loadBalancerType} load balancer`,
        confidence: pricing ? "high" : "medium",
      }
    }

    case "aws_nat_gateway": {
      return {
        resourceType,
        provider: "aws",
        monthlyCost: 32.85,
        hourlyCost: 0.045,
        details: "NAT Gateway",
        confidence: "high",
      }
    }

    case "aws_s3_bucket": {
      // S3 pricing is complex and depends on usage, so we provide a base estimate
      return {
        resourceType,
        provider: "aws",
        monthlyCost: 5, // Base estimate for small bucket
        hourlyCost: 0.007,
        details: "S3 bucket (base estimate, actual cost depends on usage)",
        confidence: "low",
      }
    }

    default:
      return null
  }
}

/**
 * Estimate GCP resource costs
 */
function estimateGCPResourceCost(
  resourceType: string,
  attributes: Record<string, any>,
): Omit<CostEstimate, "resourceAddress" | "resourceName"> | null {
  switch (resourceType) {
    case "google_compute_instance": {
      const machineType = attributes.machine_type || "e2-medium"
      const pricing = GCP_PRICING.google_compute_instance[machineType]

      if (!pricing) {
        return {
          resourceType,
          provider: "google",
          instanceType: machineType,
          monthlyCost: 25,
          hourlyCost: 0.034,
          details: `Unknown machine type: ${machineType}`,
          confidence: "low",
        }
      }

      return {
        resourceType,
        provider: "google",
        instanceType: machineType,
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: `Compute Engine ${machineType}`,
        confidence: "high",
      }
    }

    case "google_container_cluster": {
      const location = attributes.location || attributes.zone || attributes.region
      const isRegional = !attributes.zone // If no zone specified, assume regional
      const isAutopilot = attributes.enable_autopilot || false

      const clusterType = isAutopilot ? "autopilot" : isRegional ? "regional" : "zonal"
      const pricing = GCP_PRICING.google_container_cluster[clusterType]

      return {
        resourceType,
        provider: "google",
        instanceType: clusterType,
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: `GKE ${clusterType} cluster management fee`,
        confidence: "high",
      }
    }

    case "google_container_node_pool": {
      const machineType = attributes.node_config?.[0]?.machine_type || "e2-medium"
      const nodeCount = attributes.node_count || attributes.initial_node_count || 3
      const pricing = GCP_PRICING.google_container_node_pool[machineType]

      if (!pricing) {
        return {
          resourceType,
          provider: "google",
          instanceType: machineType,
          monthlyCost: nodeCount * 25,
          hourlyCost: nodeCount * 0.034,
          details: `Unknown machine type: ${machineType} (${nodeCount} nodes)`,
          confidence: "low",
        }
      }

      const totalMonthlyCost = pricing.monthly * nodeCount
      const totalHourlyCost = pricing.hourly * nodeCount

      return {
        resourceType,
        provider: "google",
        instanceType: `${machineType} x${nodeCount}`,
        monthlyCost: totalMonthlyCost,
        hourlyCost: totalHourlyCost,
        details: `GKE node pool: ${nodeCount} x ${machineType}`,
        confidence: "high",
      }
    }

    case "google_compute_disk": {
      const diskType = attributes.type || "pd-standard"
      const size = Number.parseInt(attributes.size) || 100
      const pricing = GCP_PRICING.google_compute_disk[diskType]

      if (!pricing) {
        return {
          resourceType,
          provider: "google",
          monthlyCost: size * 0.04,
          hourlyCost: (size * 0.04) / 730,
          details: `Unknown disk type: ${diskType} (${size}GB)`,
          confidence: "low",
        }
      }

      const monthlyCost = size * pricing.per_gb_monthly
      return {
        resourceType,
        provider: "google",
        monthlyCost,
        hourlyCost: monthlyCost / 730,
        details: `Persistent disk ${diskType} ${size}GB`,
        confidence: "high",
      }
    }

    case "google_sql_database_instance": {
      const tier = attributes.settings?.[0]?.tier || "db-f1-micro"
      const pricing = GCP_PRICING.google_sql_database_instance[tier]

      if (!pricing) {
        return {
          resourceType,
          provider: "google",
          instanceType: tier,
          monthlyCost: 20,
          hourlyCost: 0.027,
          details: `Unknown Cloud SQL tier: ${tier}`,
          confidence: "low",
        }
      }

      return {
        resourceType,
        provider: "google",
        instanceType: tier,
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: `Cloud SQL ${tier}`,
        confidence: "high",
      }
    }

    case "google_storage_bucket": {
      const storageClass = attributes.storage_class || "STANDARD"
      const classKey = storageClass.toLowerCase()
      const pricing = GCP_PRICING.google_storage_bucket[classKey]

      // Estimate 100GB as default since actual usage varies
      const estimatedSizeGB = 100
      const monthlyCost = pricing ? estimatedSizeGB * pricing.per_gb_monthly : 2

      return {
        resourceType,
        provider: "google",
        monthlyCost,
        hourlyCost: monthlyCost / 730,
        details: `Cloud Storage ${storageClass} (estimated ${estimatedSizeGB}GB)`,
        confidence: "low",
      }
    }

    case "google_compute_global_forwarding_rule":
    case "google_compute_forwarding_rule": {
      const pricing = GCP_PRICING.google_compute_global_forwarding_rule.http_https

      return {
        resourceType,
        provider: "google",
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: "Load Balancer forwarding rule",
        confidence: "high",
      }
    }

    case "google_compute_router": {
      const pricing = GCP_PRICING.google_compute_router.default

      return {
        resourceType,
        provider: "google",
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: "Cloud Router",
        confidence: "high",
      }
    }

    case "google_compute_router_nat": {
      const pricing = GCP_PRICING.google_compute_router_nat.default

      return {
        resourceType,
        provider: "google",
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.hourly,
        details: "Cloud NAT Gateway",
        confidence: "high",
      }
    }

    case "google_dns_managed_zone": {
      const pricing = GCP_PRICING.google_dns_managed_zone.default

      return {
        resourceType,
        provider: "google",
        monthlyCost: pricing.monthly,
        hourlyCost: pricing.monthly / 730,
        details: "Cloud DNS managed zone",
        confidence: "high",
      }
    }

    case "google_filestore_instance": {
      const tier = attributes.tier || "BASIC_HDD"
      const capacityGB = Number.parseInt(attributes.file_shares?.[0]?.capacity_gb) || 1024

      const tierKey = tier.toLowerCase().replace(/_/g, "_")
      const pricing = GCP_PRICING.google_filestore_instance[tierKey] || GCP_PRICING.google_filestore_instance.basic_hdd

      const monthlyCost = capacityGB * pricing.per_gb_monthly

      return {
        resourceType,
        provider: "google",
        monthlyCost,
        hourlyCost: monthlyCost / 730,
        details: `Filestore ${tier} ${capacityGB}GB`,
        confidence: "high",
      }
    }

    default:
      return null
  }
}

/**
 * Calculate cost summary from estimates
 */
function calculateCostSummary(estimates: CostEstimate[]): CostSummary {
  const breakdown = {
    compute: 0,
    storage: 0,
    network: 0,
    database: 0,
    other: 0,
  }

  let totalMonthlyCost = 0
  let totalHourlyCost = 0

  estimates.forEach((estimate) => {
    totalMonthlyCost += estimate.monthlyCost
    totalHourlyCost += estimate.hourlyCost

    // Categorize costs
    if (estimate.resourceType.includes("instance") || estimate.resourceType.includes("compute")) {
      breakdown.compute += estimate.monthlyCost
    } else if (
      estimate.resourceType.includes("ebs") ||
      estimate.resourceType.includes("storage") ||
      estimate.resourceType.includes("bucket")
    ) {
      breakdown.storage += estimate.monthlyCost
    } else if (
      estimate.resourceType.includes("lb") ||
      estimate.resourceType.includes("nat") ||
      estimate.resourceType.includes("vpc")
    ) {
      breakdown.network += estimate.monthlyCost
    } else if (
      estimate.resourceType.includes("rds") ||
      estimate.resourceType.includes("sql") ||
      estimate.resourceType.includes("database")
    ) {
      breakdown.database += estimate.monthlyCost
    } else {
      breakdown.other += estimate.monthlyCost
    }
  })

  return {
    totalMonthlyCost,
    totalHourlyCost,
    resourceCount: estimates.length,
    estimates,
    breakdown,
  }
}

/**
 * Get provider from resource type
 */
function getProviderFromResourceType(resourceType: string): string {
  if (resourceType.startsWith("aws_")) return "aws"
  if (resourceType.startsWith("google_")) return "google"
  if (resourceType.startsWith("azurerm_")) return "azure"
  return "unknown"
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(percentage: number): string {
  const sign = percentage > 0 ? "+" : ""
  return `${sign}${percentage.toFixed(1)}%`
}
