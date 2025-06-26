"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Trash2, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Plus, Minus, Settings } from "lucide-react"

interface TerraformVariable {
  name: string
  description: string
  type: string
  default: any
  value?: any
}

interface ProvisionedEnvironment {
  id: string
  clusterName: string
  envName: string
  status: "provisioning" | "ready" | "destroying" | "failed" | "unknown"
  createdAt: string
  lastUpdated: string
  variables: Record<string, any>
  outputs?: Record<string, any>
}

const terraformVariables: TerraformVariable[] = [
  {
    name: "cluster_name",
    description: "The name for the GKE cluster",
    type: "string",
    default: "dev-cluster",
  },
  {
    name: "env_name",
    description: "The environment for the GKE cluster",
    type: "string",
    default: "prod",
  },
  {
    name: "machine_type",
    description: "Type of machine to use for nodes",
    type: "string",
    default: "t2a-standard-8",
  },
  {
    name: "node_locations",
    description: "Location of machines to use for nodes",
    type: "list(string)",
    default: ["us-central1-a", "us-central1-b", "us-central1-f"],
  },
  {
    name: "public_pool_name",
    description: "The name for the GKE public nodes pool",
    type: "string",
    default: "public-pool",
  },
  {
    name: "public_node_count",
    description: "Initial number of public subnet nodes",
    type: "number",
    default: 1,
  },
  {
    name: "min_public_node_count",
    description: "Minimum number of public nodes for autoscaling",
    type: "number",
    default: 1,
  },
  {
    name: "max_public_node_count",
    description: "Maximum number of public nodes for autoscaling",
    type: "number",
    default: 2,
  },
  {
    name: "private_pool_name",
    description: "The name for the GKE private nodes pool",
    type: "string",
    default: "private-pool",
  },
  {
    name: "private_node_count",
    description: "Initial number of private subnet nodes",
    type: "number",
    default: 8,
  },
  {
    name: "min_private_node_count",
    description: "Minimum number of private nodes for autoscaling",
    type: "number",
    default: 4,
  },
  {
    name: "max_private_node_count",
    description: "Maximum number of private nodes for autoscaling",
    type: "number",
    default: 12,
  },
]

export function Provisioning() {
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [environments, setEnvironments] = useState<ProvisionedEnvironment[]>([])
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Initialize form with default values
  useEffect(() => {
    const initialValues: Record<string, any> = {}
    terraformVariables.forEach((variable) => {
      initialValues[variable.name] = variable.default
    })
    setFormValues(initialValues)
  }, [])

  // Load environments from localStorage
  useEffect(() => {
    const savedEnvironments = localStorage.getItem("provisionedEnvironments")
    if (savedEnvironments) {
      try {
        setEnvironments(JSON.parse(savedEnvironments))
      } catch (error) {
        console.error("Error loading environments:", error)
      }
    }
  }, [])

  // Save environments to localStorage
  useEffect(() => {
    if (environments.length > 0) {
      localStorage.setItem("provisionedEnvironments", JSON.stringify(environments))
    }
  }, [environments])

  const handleInputChange = (variableName: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [variableName]: value,
    }))
  }

  const handleArrayInputChange = (variableName: string, index: number, value: string) => {
    setFormValues((prev) => {
      const currentArray = Array.isArray(prev[variableName]) ? prev[variableName] : []
      const newArray = [...currentArray]
      newArray[index] = value
      return {
        ...prev,
        [variableName]: newArray,
      }
    })
  }

  const addArrayItem = (variableName: string) => {
    setFormValues((prev) => {
      const currentArray = Array.isArray(prev[variableName]) ? prev[variableName] : []
      return {
        ...prev,
        [variableName]: [...currentArray, ""],
      }
    })
  }

  const removeArrayItem = (variableName: string, index: number) => {
    setFormValues((prev) => {
      const currentArray = Array.isArray(prev[variableName]) ? prev[variableName] : []
      const newArray = currentArray.filter((_, i) => i !== index)
      return {
        ...prev,
        [variableName]: newArray,
      }
    })
  }

  const validateForm = () => {
    // Basic validation
    if (!formValues.cluster_name || !formValues.env_name) {
      setError("Cluster name and environment name are required")
      return false
    }

    // Check for duplicate cluster names
    const existingCluster = environments.find(
      (env) => env.clusterName === formValues.cluster_name && env.status !== "destroying" && env.status !== "failed",
    )

    if (existingCluster) {
      setError(`A cluster with name "${formValues.cluster_name}" already exists`)
      return false
    }

    return true
  }

  const handleProvision = async () => {
    setError(null)
    setSuccess(null)

    if (!validateForm()) {
      return
    }

    setIsProvisioning(true)

    try {
      // Create new environment entry
      const newEnvironment: ProvisionedEnvironment = {
        id: crypto.randomUUID(),
        clusterName: formValues.cluster_name,
        envName: formValues.env_name,
        status: "provisioning",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        variables: { ...formValues },
      }

      setEnvironments((prev) => [...prev, newEnvironment])

      // Simulate API call to provision cluster
      const response = await fetch("/api/provision-cluster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variables: formValues,
          environmentId: newEnvironment.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`Provisioning failed: ${response.statusText}`)
      }

      const result = await response.json()

      // Update environment status
      setEnvironments((prev) =>
        prev.map((env) =>
          env.id === newEnvironment.id
            ? {
                ...env,
                status: "ready",
                lastUpdated: new Date().toISOString(),
                outputs: result.outputs,
              }
            : env,
        ),
      )

      setSuccess(`Cluster "${formValues.cluster_name}" provisioned successfully!`)
    } catch (error) {
      console.error("Provisioning error:", error)
      setError(error instanceof Error ? error.message : "Provisioning failed")

      // Update environment status to failed
      setEnvironments((prev) =>
        prev.map((env) =>
          env.clusterName === formValues.cluster_name && env.status === "provisioning"
            ? { ...env, status: "failed", lastUpdated: new Date().toISOString() }
            : env,
        ),
      )
    } finally {
      setIsProvisioning(false)
    }
  }

  const handleDestroy = async (environment: ProvisionedEnvironment) => {
    if (
      !confirm(`Are you sure you want to destroy cluster "${environment.clusterName}"? This action cannot be undone.`)
    ) {
      return
    }

    setError(null)
    setSuccess(null)

    // Update status to destroying
    setEnvironments((prev) =>
      prev.map((env) =>
        env.id === environment.id ? { ...env, status: "destroying", lastUpdated: new Date().toISOString() } : env,
      ),
    )

    try {
      const response = await fetch("/api/destroy-cluster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          environmentId: environment.id,
          clusterName: environment.clusterName,
        }),
      })

      if (!response.ok) {
        throw new Error(`Destroy failed: ${response.statusText}`)
      }

      // Remove environment from list
      setEnvironments((prev) => prev.filter((env) => env.id !== environment.id))
      setSuccess(`Cluster "${environment.clusterName}" destroyed successfully!`)
    } catch (error) {
      console.error("Destroy error:", error)
      setError(error instanceof Error ? error.message : "Destroy failed")

      // Revert status
      setEnvironments((prev) =>
        prev.map((env) =>
          env.id === environment.id ? { ...env, status: "ready", lastUpdated: new Date().toISOString() } : env,
        ),
      )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "provisioning":
        return (
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-600 dark:border-amber-500 dark:text-amber-400"
          >
            <Clock className="h-3 w-3 mr-1" />
            Provisioning
          </Badge>
        )
      case "ready":
        return (
          <Badge
            variant="outline"
            className="border-green-300 text-green-600 dark:border-green-500 dark:text-green-400"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
      case "destroying":
        return (
          <Badge variant="outline" className="border-red-300 text-red-600 dark:border-red-500 dark:text-red-400">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Destroying
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="border-red-300 text-red-600 dark:border-red-500 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-500 dark:text-gray-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const renderVariableInput = (variable: TerraformVariable) => {
    const value = formValues[variable.name]

    if (variable.type === "number") {
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => handleInputChange(variable.name, Number.parseInt(e.target.value) || 0)}
          className="border-blue-300 focus:border-blue-500 dark:border-neon-cyan/30 dark:focus:border-neon-cyan"
        />
      )
    }

    if (variable.type === "list(string)") {
      const arrayValue = Array.isArray(value) ? value : variable.default || []

      return (
        <div className="space-y-2">
          {arrayValue.map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => handleArrayInputChange(variable.name, index, e.target.value)}
                className="flex-1 border-purple-300 focus:border-purple-500 dark:border-neon-purple/30 dark:focus:border-neon-purple"
                placeholder={`Item ${index + 1}`}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem(variable.name, index)}
                className="text-red-500 hover:text-red-700"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addArrayItem(variable.name)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      )
    }

    // Default to string input
    return (
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => handleInputChange(variable.name, e.target.value)}
        className="border-green-300 focus:border-green-500 dark:border-neon-green/30 dark:focus:border-neon-green"
      />
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="provision" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 bg-gray-100 dark:bg-secondary">
          <TabsTrigger value="provision">Provision New Cluster</TabsTrigger>
          <TabsTrigger value="environments">Manage Environments</TabsTrigger>
        </TabsList>

        <TabsContent value="provision" className="mt-6">
          <Card className="futuristic-panel neon-border">
            <CardHeader>
              <CardTitle className="neon-text-cyan flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Provision GKE Cluster
              </CardTitle>
              <CardDescription>Configure and provision a new Google Kubernetes Engine cluster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {terraformVariables.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <label className="text-sm font-medium">
                      {variable.name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </label>
                    <p className="text-xs text-muted-foreground">{variable.description}</p>
                    {renderVariableInput(variable)}
                    <p className="text-xs text-muted-foreground">
                      Type: {variable.type} | Default: {JSON.stringify(variable.default)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProvision} disabled={isProvisioning} className="glass-button-hover" size="lg">
                  {isProvisioning ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Provisioning...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Provision Cluster
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environments" className="mt-6">
          <Card className="futuristic-panel neon-border">
            <CardHeader>
              <CardTitle className="neon-text-purple">Provisioned Environments</CardTitle>
              <CardDescription>Manage your provisioned GKE clusters</CardDescription>
            </CardHeader>
            <CardContent>
              {environments.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Environments</h3>
                  <p className="text-muted-foreground mb-4">You haven't provisioned any clusters yet.</p>
                  <Button onClick={() => {}} className="glass-button-hover">
                    <Plus className="mr-2 h-4 w-4" />
                    Provision Your First Cluster
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-purple-200 dark:border-neon-purple/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-purple-50 dark:bg-purple-900/30">
                      <TableRow>
                        <TableHead>Cluster Name</TableHead>
                        <TableHead>Environment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Machine Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {environments.map((env) => (
                        <TableRow key={env.id} className="hover:bg-purple-50/50 dark:hover:bg-neon-purple/5">
                          <TableCell className="font-medium neon-text-purple">{env.clusterName}</TableCell>
                          <TableCell>{env.envName}</TableCell>
                          <TableCell>{getStatusBadge(env.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(env.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {env.variables.machine_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDestroy(env)}
                              disabled={env.status === "destroying" || env.status === "provisioning"}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Destroy cluster</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
