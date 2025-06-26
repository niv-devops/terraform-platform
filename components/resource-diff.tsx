"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ResourceChange } from "@/lib/types"

interface ResourceDiffProps {
  resource: ResourceChange
}

export function ResourceDiff({ resource }: ResourceDiffProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    const newExpandedKeys = new Set(expandedKeys)
    if (newExpandedKeys.has(key)) {
      newExpandedKeys.delete(key)
    } else {
      newExpandedKeys.add(key)
    }
    setExpandedKeys(newExpandedKeys)
  }

  // Get the keys that have changed
  const getChangedKeys = () => {
    const keys = new Set<string>()

    if (resource.beforeValues && resource.afterValues) {
      // Add all keys from both objects
      Object.keys(resource.beforeValues).forEach((key) => keys.add(key))
      Object.keys(resource.afterValues).forEach((key) => keys.add(key))
    }

    return Array.from(keys)
  }

  // Check if a value has changed
  const hasValueChanged = (key: string) => {
    if (!resource.beforeValues || !resource.afterValues) return true

    const before = resource.beforeValues[key]
    const after = resource.afterValues[key]

    if (typeof before === "object" && typeof after === "object") {
      return JSON.stringify(before) !== JSON.stringify(after)
    }

    return before !== after
  }

  // Format a value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "null"
    if (typeof value === "object") return JSON.stringify(value, null, 2)
    return String(value)
  }

  // Get the appropriate color for a diff line
  const getDiffClass = (key: string) => {
    if (!resource.beforeValues || !resource.afterValues) return ""

    if (!(key in resource.beforeValues)) {
      return "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
    }

    if (!(key in resource.afterValues)) {
      return "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
    }

    if (hasValueChanged(key)) {
      return "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
    }

    return ""
  }

  if (resource.action === "no-op") {
    return (
      <Card className="futuristic-panel">
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">No changes to this resource</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="futuristic-panel neon-border">
      <CardHeader>
        <CardTitle className="neon-text-cyan">{resource.address}</CardTitle>
        <CardDescription>
          {resource.action === "create" && "This resource will be created"}
          {resource.action === "update" && "This resource will be updated"}
          {resource.action === "delete" && "This resource will be destroyed"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border border-blue-200 dark:border-neon-cyan/20 p-4">
          <div className="font-mono text-sm">
            {resource.action === "create" && (
              <div className="mb-2">
                <Badge
                  variant="outline"
                  className="border-green-300 text-green-600 dark:border-green-500 dark:text-green-400"
                >
                  + create
                </Badge>
              </div>
            )}

            {resource.action === "delete" && (
              <div className="mb-2">
                <Badge variant="outline" className="border-red-300 text-red-600 dark:border-red-500 dark:text-red-400">
                  - destroy
                </Badge>
              </div>
            )}

            {resource.action === "update" && (
              <div className="mb-2">
                <Badge
                  variant="outline"
                  className="border-amber-300 text-amber-600 dark:border-amber-500 dark:text-amber-400"
                >
                  ~ update
                </Badge>
              </div>
            )}

            <div className="space-y-1">
              {getChangedKeys().map((key) => (
                <div key={key} className={`p-1 rounded ${getDiffClass(key)}`}>
                  {resource.action === "create" && <span className="text-green-600 dark:text-green-400">+ </span>}
                  {resource.action === "delete" && <span className="text-red-600 dark:text-red-400">- </span>}
                  {resource.action === "update" && hasValueChanged(key) && (
                    <span className="text-amber-600 dark:text-amber-400">~ </span>
                  )}

                  <span className="font-semibold">{key}</span>

                  {resource.action === "update" && hasValueChanged(key) && (
                    <>
                      <div className="pl-4 mt-1">
                        <div className="text-red-600 dark:text-red-400">
                          - {formatValue(resource.beforeValues?.[key])}
                        </div>
                        <div className="text-green-600 dark:text-green-400">
                          + {formatValue(resource.afterValues?.[key])}
                        </div>
                      </div>
                    </>
                  )}

                  {(resource.action === "create" || resource.action === "delete" || !hasValueChanged(key)) && (
                    <div className="pl-4">
                      {resource.action === "create" && formatValue(resource.afterValues?.[key])}
                      {resource.action === "delete" && formatValue(resource.beforeValues?.[key])}
                      {resource.action === "update" &&
                        !hasValueChanged(key) &&
                        formatValue(resource.afterValues?.[key])}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
