"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Search, AlertCircle } from "lucide-react"
import { useState } from "react"
import type { TerraformModule } from "@/lib/types"

interface ModulesTableProps {
  modules: TerraformModule[]
}

export function ModulesTable({ modules }: ModulesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const safeModules = Array.isArray(modules) ? modules : []

  const filteredModules = safeModules.filter((module) => {
    if (!module) return false
    const name = module.name || ""
    const path = module.path || ""
    const searchLower = searchTerm.toLowerCase()
    return name.toLowerCase().includes(searchLower) || path.toLowerCase().includes(searchLower)
  })

  if (!Array.isArray(modules)) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid modules data format. Expected an array but received: {typeof modules}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search modules..."
            className="w-full pl-8 border-pink-300 focus:border-pink-500 dark:border-neon-pink/30 dark:focus:border-neon-pink"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">{safeModules.length} total modules</div>
      </div>

      <div className="rounded-md border border-pink-200 dark:border-neon-pink/20 overflow-hidden bg-white dark:bg-transparent">
        <Table>
          <TableHeader className="bg-pink-50 dark:bg-pink-900/30 [&_th]:text-gray-900 dark:[&_th]:text-white">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Resources</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  <div className="space-y-2">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <div>
                      <p className="font-medium">No modules found</p>
                      <p className="text-sm text-muted-foreground">
                        {safeModules.length === 0
                          ? "This Terraform state doesn't contain any modules."
                          : "No modules match your search criteria."}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredModules.map((module, index) => (
                <TableRow
                  key={module.path || index}
                  className="hover:bg-pink-50/50 dark:hover:bg-neon-pink/5 [&_td]:text-foreground"
                >
                  <TableCell className="font-medium neon-text-pink">{module.name || `Module ${index + 1}`}</TableCell>
                  <TableCell className="font-mono text-xs">{module.path || "unknown"}</TableCell>
                  <TableCell>{module.resources?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-neon-pink/10 dark:hover:text-neon-pink"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
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
