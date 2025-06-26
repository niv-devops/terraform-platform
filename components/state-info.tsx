"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TerraformState } from "@/lib/types"

interface StateInfoProps {
  terraformState: TerraformState
}

export function StateInfo({ terraformState }: StateInfoProps) {
  // Safe access to state properties
  const getStateVersion = () => {
    try {
      return terraformState?.version?.toString() || "Unknown"
    } catch {
      return "Unknown"
    }
  }

  const getTerraformVersion = () => {
    try {
      return terraformState?.terraform_version || "Unknown"
    } catch {
      return "Unknown"
    }
  }

  const getSerial = () => {
    try {
      return terraformState?.serial?.toString() || "Unknown"
    } catch {
      return "Unknown"
    }
  }

  const getLineage = () => {
    try {
      return terraformState?.lineage || "Unknown"
    } catch {
      return "Unknown"
    }
  }

  const getResourcesCount = () => {
    try {
      return terraformState?.resources?.length || 0
    } catch {
      return 0
    }
  }

  const getModulesCount = () => {
    try {
      return terraformState?.modules?.length || 0
    } catch {
      return 0
    }
  }

  const getProvidersCount = () => {
    try {
      return terraformState?.providers?.length || 0
    } catch {
      return 0
    }
  }

  const getResourceTypes = () => {
    try {
      return Array.from(new Set(terraformState?.resources?.map((r) => r?.type).filter(Boolean) || []))
    } catch {
      return []
    }
  }

  const getModules = () => {
    try {
      return terraformState?.modules || []
    } catch {
      return []
    }
  }

  const getProviders = () => {
    try {
      return terraformState?.providers || []
    } catch {
      return []
    }
  }

  if (!terraformState) {
    return <div className="text-center text-muted-foreground">No state information available</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="futuristic-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">State Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold neon-text-cyan">{getStateVersion()}</div>
          </CardContent>
        </Card>

        <Card className="futuristic-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Terraform Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold neon-text-purple">{getTerraformVersion()}</div>
          </CardContent>
        </Card>

        <Card className="futuristic-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Serial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold neon-text-pink">{getSerial()}</div>
          </CardContent>
        </Card>

        <Card className="futuristic-panel">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lineage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono truncate neon-text-green">{getLineage()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="futuristic-panel neon-border">
        <CardHeader>
          <CardTitle className="neon-text-cyan">State Summary</CardTitle>
          <CardDescription>Overview of your Terraform state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50/50 border border-blue-200 dark:bg-blue-900/20 dark:border-neon-cyan/20">
              <div className="text-3xl font-bold neon-text-cyan">{getResourcesCount()}</div>
              <div className="text-sm text-muted-foreground">Total Resources</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50/50 border border-purple-200 dark:bg-purple-900/20 dark:border-neon-purple/20">
              <div className="text-3xl font-bold neon-text-purple">{getModulesCount()}</div>
              <div className="text-sm text-muted-foreground">Total Modules</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-indigo-50/50 border border-indigo-200 dark:bg-indigo-900/20 dark:border-neon-blue/20">
              <div className="text-3xl font-bold neon-text-blue">{getProvidersCount()}</div>
              <div className="text-sm text-muted-foreground">Total Providers</div>
            </div>
          </div>

          {getResourceTypes().length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold neon-text-purple">Resource Types</h4>
              <div className="flex flex-wrap gap-2">
                {getResourceTypes().map((type) => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="border-purple-300 text-purple-600 dark:border-neon-purple/50 dark:text-neon-purple"
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {getModules().length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold neon-text-pink">Modules</h4>
              <div className="flex flex-wrap gap-2">
                {getModules().map((module) => (
                  <Badge
                    key={module.path}
                    variant="outline"
                    className="border-pink-300 text-pink-600 dark:border-neon-pink/50 dark:text-neon-pink"
                  >
                    {module.name} ({module.resources?.length || 0} resources)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {getProviders().length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold neon-text-blue">Providers</h4>
              <div className="flex flex-wrap gap-2">
                {getProviders().map((provider, index) => (
                  <Badge
                    key={`${provider.name}-${index}`}
                    variant="outline"
                    className="border-indigo-300 text-indigo-600 dark:border-neon-blue/50 dark:text-neon-blue"
                  >
                    {provider.name} v{provider.version}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {getResourcesCount() === 0 && getModulesCount() === 0 && getProvidersCount() === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No infrastructure data found in the state file</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
