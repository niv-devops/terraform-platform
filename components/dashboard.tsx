"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Sidebar } from "@/components/sidebar"
import { ResourcesTable } from "@/components/resources-table"
import { ModulesTable } from "@/components/modules-table"
import { ProvidersTable } from "@/components/providers-table"
import { StateInfo } from "@/components/state-info"
import { ResourceGraph } from "@/components/resource-graph"
import { InfrastructureConfig } from "@/components/infrastructure-config"
import { PlanAnalysis } from "@/components/plan-analysis"
import { CostDashboard } from "@/components/cost-dashboard"
import { ModeToggle } from "@/components/mode-toggle"
import { Logo } from "@/components/logo"
import { Header } from "@/components/header"
import { AlertCircle, Check, Plus, RefreshCw } from "lucide-react"
import type { TerraformState } from "@/lib/types"
import { Provisioning } from "@/components/provisioning"

interface Configuration {
  id: string
  name: string
  bucket: string
  path: string
  lastUpdated: string
}

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [terraformState, setTerraformState] = useState<TerraformState | null>(null)

  // Load saved configurations from localStorage
  useEffect(() => {
    const savedConfigs = localStorage.getItem("terraformConfigurations")
    if (savedConfigs) {
      try {
        const parsed = JSON.parse(savedConfigs)
        setConfigurations(parsed)
      } catch (error) {
        console.error("Error parsing saved configurations:", error)
      }
    }
  }, [])

  // Save configurations to localStorage when they change
  useEffect(() => {
    if (configurations.length > 0) {
      localStorage.setItem("terraformConfigurations", JSON.stringify(configurations))
    }
  }, [configurations])

  const addConfiguration = (config: Omit<Configuration, "id" | "lastUpdated">) => {
    const newConfig = {
      ...config,
      id: crypto.randomUUID(),
      lastUpdated: new Date().toISOString(),
    }

    setConfigurations((prev) => [...prev, newConfig])
    setSelectedConfig(newConfig.id)
  }

  const removeConfiguration = (id: string) => {
    setConfigurations(configurations.filter((config) => config.id !== id))
    if (selectedConfig === id) {
      setSelectedConfig(null)
      setTerraformState(null)
    }
  }

  const loadTerraformState = async (configId: string) => {
    setLoading(true)
    setError(null)
    setSelectedConfig(configId)

    try {
      const config = configurations.find((c) => c.id === configId)
      if (!config) throw new Error("Configuration not found")

      const response = await fetch("/api/terraform-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucketName: config.bucket,
          filePath: config.path,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch Terraform state: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const rawData = await response.json()

      // Parse the state data
      const parsedState: TerraformState = {
        version: rawData.version || rawData.format_version || 4,
        terraform_version: rawData.terraform_version || rawData.terraform?.version || "unknown",
        serial: rawData.serial || 1,
        lineage: rawData.lineage || "unknown",
        resources: [],
        modules: [],
        providers: [],
      }

      // Parse resources
      let resourcesData: any[] = []
      if (rawData.resources && Array.isArray(rawData.resources)) {
        resourcesData = rawData.resources
      } else if (rawData.values?.root_module?.resources && Array.isArray(rawData.values.root_module.resources)) {
        resourcesData = rawData.values.root_module.resources
      }

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

          parsedState.resources.push({
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
      parsedState.resources.forEach((resource) => {
        if (resource.module && resource.module.trim()) {
          moduleRefs.add(resource.module.trim())
        }
      })

      moduleRefs.forEach((modulePath) => {
        const moduleName = modulePath.replace(/^module\./, "")
        const moduleResources = parsedState.resources.filter((r) => r.module === modulePath)

        parsedState.modules.push({
          name: moduleName,
          path: modulePath,
          resources: moduleResources,
        })
      })

      // Parse providers
      const providerSources = [
        rawData.terraform?.required_providers,
        rawData.configuration?.provider_config,
        rawData.values?.root_module?.providers,
        rawData.provider_hash,
        rawData.providers,
        rawData.configuration?.terraform?.required_providers,
      ]

      providerSources.forEach((source) => {
        if (source && typeof source === "object") {
          Object.entries(source).forEach(([name, data]: [string, any]) => {
            if (!parsedState.providers.find((p) => p.name === name)) {
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

              parsedState.providers.push({
                name: name,
                version: version,
              })
            }
          })
        }
      })

      // Extract providers from resource types if none found
      if (parsedState.providers.length === 0) {
        const providerNames = new Set(
          parsedState.resources
            .map((r) => r.type.split("_")[0])
            .filter(Boolean)
            .filter((name) => !["data", "local", "null", "random", "template", "external"].includes(name)),
        )

        providerNames.forEach((name) => {
          parsedState.providers.push({
            name: name,
            version: "detected from resources",
          })
        })
      }

      setTerraformState(parsedState)
    } catch (err: any) {
      console.error("Error loading Terraform state:", err)
      setError(err.message || "Failed to load Terraform state")
      setTerraformState(null)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigation = (section: string) => {
    setActiveSection(section)
  }

  const handleAddConfigClick = () => {
    setActiveSection("config")
  }

  const getResourcesCount = () => {
    return terraformState?.resources?.length || 0
  }

  const getModulesCount = () => {
    return terraformState?.modules?.length || 0
  }

  const getProvidersCount = () => {
    return terraformState?.providers?.length || 0
  }

  const getRecentResources = () => {
    return terraformState?.resources?.slice(0, 5) || []
  }

  const renderContent = () => {
    if (activeSection === "config") {
      return (
        <InfrastructureConfig
          configurations={configurations}
          onAddConfiguration={addConfiguration}
          onRemoveConfiguration={removeConfiguration}
          onSelectConfiguration={loadTerraformState}
          selectedConfig={selectedConfig}
        />
      )
    }

    if (!selectedConfig) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">No Configuration Selected</h2>
            <p className="text-muted-foreground">Select an existing configuration or add a new one to get started.</p>
          </div>
          <Button onClick={handleAddConfigClick} className="glass-button-hover">
            <Plus className="mr-2 h-4 w-4" />
            Add Configuration
          </Button>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p>Loading Terraform state...</p>
        </div>
      )
    }

    if (error) {
      return (
        <Alert variant="destructive" className="glass-effect glass-gradient-border">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{error}</p>
              <p className="text-sm">Check the browser console for more details.</p>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    if (!terraformState) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">No Data Available</h2>
            <p className="text-muted-foreground">Unable to load Terraform state data.</p>
          </div>
          <Button onClick={() => selectedConfig && loadTerraformState(selectedConfig)} className="glass-button-hover">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      )
    }

    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold neon-text-cyan">Total Resources</CardTitle>
                  <CardDescription>Total resources managed by Terraform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold neon-text-cyan">{getResourcesCount()}</div>
                </CardContent>
              </Card>
              <Card className="glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold neon-text-purple">Modules</CardTitle>
                  <CardDescription>Total modules in your infrastructure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold neon-text-purple">{getModulesCount()}</div>
                </CardContent>
              </Card>
              <Card className="glass-effect">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold neon-text-pink">Providers</CardTitle>
                  <CardDescription>Total Infrastructure providers in use</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold neon-text-pink">{getProvidersCount()}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Resource Graph</CardTitle>
                <CardDescription>Visual representation of your infrastructure</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px]">
                  <ResourceGraph terraformState={terraformState} />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>Recent Resources</CardTitle>
                  <CardDescription>Recently modified resources</CardDescription>
                </CardHeader>
                <CardContent>
                  {getRecentResources().length > 0 ? (
                    getRecentResources().map((resource: any, i: number) => (
                      <div
                        key={i}
                        className="mb-2 flex items-center justify-between rounded-lg border p-2 glass-nav-item"
                      >
                        <div className="flex items-center">
                          <div className="ml-2">
                            <p className="text-sm font-medium leading-none">{resource?.name || `Resource ${i + 1}`}</p>
                            <p className="text-xs text-muted-foreground">{resource?.type || "Unknown type"}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="glass-gradient-border">
                          {resource?.type?.split("_")?.[0] || "Unknown"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No resources found</p>
                  )}
                </CardContent>
              </Card>
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle>State Information</CardTitle>
                  <CardDescription>Terraform state metadata</CardDescription>
                </CardHeader>
                <CardContent>
                  <StateInfo terraformState={terraformState} />
                </CardContent>
              </Card>
            </div>
          </div>
        )
      case "resources":
        return <ResourcesTable resources={terraformState.resources} />
      case "modules":
        return <ModulesTable modules={terraformState.modules} />
      case "providers":
        return <ProvidersTable providers={terraformState.providers} />
      case "graph":
        return (
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Resource Graph</CardTitle>
              <CardDescription>Visual representation of your infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ResourceGraph terraformState={terraformState} />
              </div>
            </CardContent>
          </Card>
        )
      case "state":
        return <StateInfo terraformState={terraformState} />
      case "plan":
        return <PlanAnalysis currentState={terraformState} />
      case "costs":
        return <CostDashboard terraformState={terraformState} />
      case "provisioning":
        return <Provisioning />
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Section Not Found</h2>
              <p className="text-muted-foreground">The requested section could not be found.</p>
            </div>
          </div>
        )
    }
  }

  const config = configurations.find((c) => c.id === selectedConfig)

  return (
    <div className="flex min-h-screen">
      <Sidebar onNavigate={handleNavigation} activeSection={activeSection} />
      <div className="flex-1 flex flex-col">
        <Header>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-neon-cyan dark:to-neon-purple flex items-center justify-center text-white dark:text-primary-foreground text-sm font-bold">
              TF
            </span>
            <h1 className="text-xl font-bold glass-text-gradient">Terraform Platform</h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedConfig && (
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="outline" className="glass-gradient-border">
                  <Check className="mr-1 h-3 w-3" />
                  {config?.name}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTerraformState(selectedConfig)}
                  className="glass-button-hover"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Refresh
                </Button>
              </div>
            )}
            <ModeToggle />
          </div>
        </Header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="mx-auto max-w-7xl">
            {selectedConfig && config && (
              <Card className="glass-effect mb-4">
                <CardHeader className="py-3">
                  <div className="flex items-center gap-6">
                    <span className="font-semibold text-base neon-text-cyan">{config.name}</span>
                    <span className="text-sm">
                      <span className="neon-text-purple font-semibold">Bucket</span>
                      : <span className="font-mono">{config.bucket}</span>
                    </span>
                    <span className="text-sm">
                      <span className="neon-text-pink font-semibold">Path</span>
                      : <span className="font-mono">{config.path}</span>
                    </span>
                  </div>
                </CardHeader>
              </Card>
            )}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}