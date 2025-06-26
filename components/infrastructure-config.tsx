"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, Check, AlertCircle } from "lucide-react"

interface Configuration {
  id: string
  name: string
  bucket: string
  path: string
  lastUpdated: string
}

interface InfrastructureConfigProps {
  configurations: Configuration[]
  onAddConfiguration: (config: Omit<Configuration, "id" | "lastUpdated">) => void
  onRemoveConfiguration: (id: string) => void
  onSelectConfiguration: (id: string) => void
  selectedConfig: string | null
}

export function InfrastructureConfig({
  configurations,
  onAddConfiguration,
  onRemoveConfiguration,
  onSelectConfiguration,
  selectedConfig,
}: InfrastructureConfigProps) {
  const [name, setName] = useState("")
  const [bucket, setBucket] = useState("")
  const [path, setPath] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    setError(null)

    // Validate form
    if (!name.trim()) {
      setError("Please enter a configuration name")
      return
    }
    if (!bucket.trim()) {
      setError("Please enter a bucket name")
      return
    }
    if (!path.trim()) {
      setError("Please enter a file path")
      return
    }

    try {
      const newConfig = {
        name: name.trim(),
        bucket: bucket.trim(),
        path: path.trim(),
      }

      onAddConfiguration(newConfig)

      // Clear form
      setName("")
      setBucket("")
      setPath("")
    } catch (error) {
      setError("Error adding configuration")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="futuristic-panel neon-border">
        <CardHeader>
          <CardTitle className="neon-text-cyan">Add Infrastructure Configuration</CardTitle>
          <CardDescription>Configure access to your Terraform state files stored in GCP buckets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Configuration Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production Infrastructure"
              className="border-blue-300 focus:border-blue-500 dark:border-neon-cyan/30 dark:focus:border-neon-cyan"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">GCP Bucket Name</label>
            <Input
              type="text"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="my-terraform-state"
              className="border-purple-300 focus:border-purple-500 dark:border-neon-purple/30 dark:focus:border-neon-purple"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">State File Path</label>
            <Input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="env/prod/terraform.tfstate"
              className="border-pink-300 focus:border-pink-500 dark:border-neon-pink/30 dark:focus:border-neon-pink"
            />
          </div>

          <Button onClick={handleAdd} className="w-full glass-button-hover">
            <Plus className="mr-2 h-4 w-4" />
            Add Configuration
          </Button>
        </CardContent>
      </Card>

      {configurations.length > 0 && (
        <Card className="futuristic-panel neon-border">
          <CardHeader>
            <CardTitle className="neon-text-purple">Saved Configurations</CardTitle>
            <CardDescription>Manage your infrastructure configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {configurations.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-neon-cyan/5 bg-white dark:bg-transparent text-foreground ${
                    selectedConfig === config.id
                      ? "border-blue-500 bg-blue-50/80 dark:border-neon-cyan dark:bg-neon-cyan/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => onSelectConfiguration(config.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold neon-text-cyan">{config.name}</h3>
                        {selectedConfig === config.id && (
                          <Badge
                            variant="outline"
                            className="border-green-300 text-green-600 dark:border-green-500 dark:text-green-400"
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium text-foreground">Bucket:</span> {config.bucket}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Path:</span> {config.path}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Last Updated:</span>{" "}
                          {new Date(config.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveConfiguration(config.id)
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
