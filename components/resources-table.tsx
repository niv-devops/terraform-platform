"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, ExternalLink, Filter, Search } from "lucide-react"
import { useState } from "react"
import type { TerraformResource } from "@/lib/types"

interface ResourcesTableProps {
  resources: TerraformResource[]
}

export function ResourcesTable({ resources }: ResourcesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string | null>(null)

  // Get unique resource types for filtering
  const resourceTypes = [...new Set(resources.map((r) => r.type))]

  // Filter resources based on search and type filter
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTypeFilter = resourceTypeFilter ? resource.type === resourceTypeFilter : true

    return matchesSearch && matchesTypeFilter
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search resources..."
            className="w-full pl-8 border-blue-300 focus:border-blue-500 dark:border-neon-cyan/30 dark:focus:border-neon-cyan"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:border-neon-purple/30 dark:hover:border-neon-purple dark:hover:bg-neon-purple/10"
            >
              <Filter className="mr-2 h-4 w-4" />
              {resourceTypeFilter || "All Resource Types"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => setResourceTypeFilter(null)}>All Resource Types</DropdownMenuItem>
            {resourceTypes.map((type) => (
              <DropdownMenuItem key={type} onClick={() => setResourceTypeFilter(type)}>
                {type}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border border-blue-200 dark:border-neon-cyan/20 overflow-hidden bg-white dark:bg-transparent">
        <Table>
          <TableHeader className="bg-blue-50 dark:bg-blue-900/30 [&_th]:text-gray-900 dark:[&_th]:text-white">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Module</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((resource) => (
                <TableRow
                  key={resource.id}
                  className="hover:bg-blue-50/50 dark:hover:bg-neon-cyan/5 [&_td]:text-foreground"
                >
                  <TableCell className="font-medium neon-text-cyan">{resource.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-purple-300 text-purple-600 dark:border-neon-purple/50 dark:text-neon-purple"
                    >
                      {resource.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs truncate max-w-[200px]">{resource.id}</TableCell>
                  <TableCell>{resource.module || "root"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-neon-cyan/10 dark:hover:text-neon-cyan"
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
