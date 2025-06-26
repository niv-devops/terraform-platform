"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, AlertCircle } from "lucide-react"
import { useState } from "react"
import type { TerraformProvider } from "@/lib/types"

interface ProvidersTableProps {
  providers: TerraformProvider[]
}

export function ProvidersTable({ providers }: ProvidersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const safeProviders = Array.isArray(providers) ? providers : []

  const filteredProviders = safeProviders.filter((provider) => {
    if (!provider) return false
    const name = provider.name || ""
    const version = provider.version || ""
    const searchLower = searchTerm.toLowerCase()
    return name.toLowerCase().includes(searchLower) || version.toLowerCase().includes(searchLower)
  })

  if (!Array.isArray(providers)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid providers data format. Expected an array but received: {typeof providers}
        </AlertDescription>
      </Alert>
    )
  }

  const getProviderType = (providerName: string) => {
    const name = providerName.toLowerCase()
    if (name.includes("aws")) return "Cloud Provider"
    if (name.includes("google") || name.includes("gcp")) return "Cloud Provider"
    if (name.includes("azurerm") || name.includes("azure")) return "Cloud Provider"
    if (name.includes("kubernetes") || name.includes("k8s")) return "Orchestration"
    if (name.includes("helm")) return "Package Manager"
    if (name.includes("docker")) return "Container"
    if (name.includes("vault")) return "Security"
    if (name.includes("consul")) return "Service Discovery"
    if (name.includes("nomad")) return "Orchestration"
    if (name.includes("terraform")) return "Core"
    return "Infrastructure"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search providers..."
            className="w-full pl-8 border-indigo-300 focus:border-indigo-500 dark:border-neon-blue/30 dark:focus:border-neon-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">{safeProviders.length} total providers</div>
      </div>

      <div className="rounded-md border border-indigo-200 dark:border-neon-blue/20 overflow-hidden bg-white dark:bg-transparent">
        <Table>
          <TableHeader className="bg-indigo-50 dark:bg-indigo-900/30 [&_th]:text-gray-900 dark:[&_th]:text-white">
            <TableRow>
              <TableHead>Provider Name</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  <div className="space-y-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">No providers found</p>
                      <p className="text-sm text-muted-foreground">
                        {safeProviders.length === 0
                          ? "This Terraform state doesn't contain provider information."
                          : "No providers match your search criteria."}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProviders.map((provider, index) => (
                <TableRow
                  key={`${provider.name}-${index}`}
                  className="hover:bg-indigo-50/50 dark:hover:bg-neon-blue/5 [&_td]:text-foreground"
                >
                  <TableCell className="font-medium neon-text-blue">
                    {provider.name || `Provider ${index + 1}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-indigo-300 text-indigo-600 dark:border-neon-blue/50 dark:text-neon-blue"
                    >
                      {provider.version || "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-gray-300 text-gray-600 dark:border-gray-500 dark:text-gray-400"
                    >
                      {getProviderType(provider.name || "")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
