import type { TerraformState, TerraformResource, TerraformModule, TerraformProvider } from "./types"

const stateCache: { [key: string]: TerraformState } = {}

export async function fetchTerraformState(
  bucketName: string,
  filePath: string,
  forceRefresh = false,
): Promise<TerraformState> {
  const cacheKey = `${bucketName}/${filePath}`

  if (stateCache[cacheKey] && !forceRefresh) {
    return stateCache[cacheKey]
  }

  if (!bucketName || !filePath) {
    throw new Error("Bucket name and file path are required")
  }

  try {
    const stateData = await fetchStateFromGCP(bucketName, filePath)
    stateCache[cacheKey] = stateData
    return stateData
  } catch (error) {
    console.error("Error fetching Terraform state:", error)
    throw error
  }
}

async function fetchStateFromGCP(bucketName: string, filePath: string): Promise<TerraformState> {
  try {
    const response = await fetch("/api/terraform-state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucketName,
        filePath,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch state: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const rawState = await response.json()
    return parseStateFile(rawState)
  } catch (error) {
    console.error("Error in fetchStateFromGCP:", error)
    throw error
  }
}

function parseStateFile(rawState: any): TerraformState {
  const resources: TerraformResource[] = []
  const modules: TerraformModule[] = []
  const providers: TerraformProvider[] = []

  try {
    // Parse resources from multiple possible locations
    let resourcesData: any[] = []

    if (rawState.resources && Array.isArray(rawState.resources)) {
      resourcesData = rawState.resources
    } else if (rawState.values?.root_module?.resources && Array.isArray(rawState.values.root_module.resources)) {
      resourcesData = rawState.values.root_module.resources
    }

    // Process resources
    resourcesData.forEach((resource: any, index: number) => {
      try {
        const resourceType = resource.type || "unknown"
        const resourceName = resource.name || `resource-${index}`
        const resourceId = `${resourceType}.${resourceName}`
        let resourceModule = resource.module || null

        if (resourceModule && !resourceModule.startsWith("module.")) {
          resourceModule = `module.${resourceModule}`
        }

        const resourceAttributes = resource.instances?.[0]?.attributes || resource.values || {}

        resources.push({
          id: resourceId,
          name: resourceName,
          type: resourceType,
          module: resourceModule,
          dependencies: resource.dependencies || [],
          attributes: resourceAttributes,
        })
      } catch (error) {
        // Skip invalid resources
      }
    })

    // Create modules from resource module references
    const moduleRefs = new Set<string>()
    resources.forEach((resource) => {
      if (resource.module && resource.module.trim()) {
        moduleRefs.add(resource.module.trim())
      }
    })

    moduleRefs.forEach((modulePath) => {
      const moduleName = modulePath.replace(/^module\./, "")
      const moduleResources = resources.filter((r) => r.module === modulePath)

      modules.push({
        name: moduleName,
        path: modulePath,
        resources: moduleResources,
      })
    })

    // Parse providers from multiple sources
    const providerSources = [
      rawState.terraform?.required_providers,
      rawState.configuration?.provider_config,
      rawState.values?.root_module?.providers,
      rawState.provider_hash,
      rawState.providers,
      rawState.configuration?.terraform?.required_providers,
    ]

    providerSources.forEach((source) => {
      if (source && typeof source === "object") {
        Object.entries(source).forEach(([name, data]: [string, any]) => {
          if (!providers.find((p) => p.name === name)) {
            let version = "unknown"

            if (typeof data === "string") {
              version = data
            } else if (data?.version) {
              version = data.version
            } else if (data?.version_constraint) {
              version = data.version_constraint
            } else if (data?.source) {
              version = data.source
            } else if (data?.constraints) {
              version = data.constraints
            }

            providers.push({
              name: name,
              version: version,
            })
          }
        })
      }
    })

    // Extract providers from resource types if none found
    if (providers.length === 0) {
      const providerNames = new Set(
        resources
          .map((r) => r.type.split("_")[0])
          .filter(Boolean)
          .filter((name) => !["data", "local", "null", "random", "template", "external"].includes(name)),
      )

      providerNames.forEach((name) => {
        providers.push({
          name: name,
          version: "detected from resources",
        })
      })
    }

    return {
      version: rawState.version || rawState.format_version || 4,
      terraform_version: rawState.terraform_version || rawState.terraform?.version || "unknown",
      serial: rawState.serial || 1,
      lineage: rawState.lineage || "unknown",
      resources,
      modules,
      providers,
    }
  } catch (error) {
    return {
      version: rawState.version || 4,
      terraform_version: rawState.terraform_version || "unknown",
      serial: rawState.serial || 1,
      lineage: rawState.lineage || "unknown",
      resources: [],
      modules: [],
      providers: [],
    }
  }
}
