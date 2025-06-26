import type { TerraformPlan, ResourceChange } from "./types"

/**
 * Parse a Terraform plan file
 * This function handles both binary .tfplan files and JSON plan files
 */
export async function parseTerraformPlan(file: File): Promise<TerraformPlan> {
  try {
    // For JSON files (terraform show -json plan.tfplan > plan.json)
    if (file.name.endsWith(".json")) {
      const text = await file.text()
      return parsePlanJson(text)
    }

    // For binary .tfplan files
    // Note: Binary .tfplan files can't be directly parsed in the browser
    // We'll provide a workaround by asking users to convert to JSON first
    throw new Error(
      "Binary .tfplan files cannot be parsed directly in the browser. Please convert to JSON using: terraform show -json plan.tfplan > plan.json",
    )
  } catch (error) {
    console.error("Error parsing plan file:", error)
    throw error
  }
}

/**
 * Parse a Terraform plan JSON file
 */
function parsePlanJson(jsonText: string): TerraformPlan {
  try {
    const planData = JSON.parse(jsonText)

    // Extract the relevant information from the plan
    const resourceChanges = extractResourceChanges(planData)
    const summary = generatePlanSummary(resourceChanges)

    return {
      format_version: planData.format_version || "unknown",
      terraform_version: planData.terraform_version || "unknown",
      resourceChanges,
      summary,
      rawPlan: planData,
    }
  } catch (error) {
    console.error("Error parsing JSON plan:", error)
    throw new Error("Invalid Terraform plan JSON format")
  }
}

/**
 * Extract resource changes from the plan data
 */
function extractResourceChanges(planData: any): ResourceChange[] {
  const changes: ResourceChange[] = []

  // Handle different plan formats
  const resourceChanges = planData.resource_changes || planData.planned_values?.root_module?.resources || []

  resourceChanges.forEach((change: any) => {
    // Skip data sources
    if (change.mode === "data") return

    const resourceChange: ResourceChange = {
      address: change.address,
      type: change.type,
      name: change.name,
      provider: change.provider_name || extractProviderFromType(change.type),
      action: change.change?.actions?.[0] || "no-op",
      beforeValues: change.change?.before || null,
      afterValues: change.change?.after || null,
      module: extractModuleFromAddress(change.address),
    }

    changes.push(resourceChange)
  })

  return changes
}

/**
 * Generate a summary of the plan changes
 */
function generatePlanSummary(changes: ResourceChange[]) {
  const summary = {
    add: 0,
    change: 0,
    destroy: 0,
    total: changes.length,
  }

  changes.forEach((change) => {
    if (change.action === "create") summary.add++
    else if (change.action === "update") summary.change++
    else if (change.action === "delete") summary.destroy++
  })

  return summary
}

/**
 * Extract the provider name from a resource type
 */
function extractProviderFromType(type: string): string {
  const parts = type.split("_")
  return parts[0] || "unknown"
}

/**
 * Extract the module name from a resource address
 */
function extractModuleFromAddress(address: string): string | null {
  if (address.includes("module.")) {
    const parts = address.split(".")
    const moduleIndex = parts.findIndex((part) => part.startsWith("module"))
    if (moduleIndex >= 0 && moduleIndex + 1 < parts.length) {
      return parts[moduleIndex + 1]
    }
  }
  return null
}
