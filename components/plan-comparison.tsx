"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Minus, RefreshCw } from "lucide-react"
import type { TerraformPlan, ResourceChange } from "@/lib/types"

interface PlanComparisonProps {
  plan: TerraformPlan
}

export function PlanComparison({ plan }: PlanComparisonProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState<string>("all")

  // Filter resources based on search and selected tab
  const filteredResources = plan.resourceChanges.filter((resource) => {
    const matchesSearch =
      resource.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "create" && resource.action === "create") ||
      (selectedTab === "update" && resource.action === "update") ||
      (selectedTab === "delete" && resource.action === "delete")

    return matchesSearch && matchesTab
  })

  // Get action badge
  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <Badge
            variant="outline"
            className="border-green-300 text-green-600 dark:border-green-500 dark:text-green-400"
          >
            <Plus className="h-3 w-3 mr-1" />
            Create
          </Badge>
        )
      case "update":
        return (
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-600 dark:border-amber-500 dark:text-amber-400"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Update
          </Badge>
        )
      case "delete":
        return (
          <Badge variant="outline" className="border-red-300 text-red-600 dark:border-red-500 dark:text-red-400">
            <Minus className="h-3 w-3 mr-1" />
            Delete
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600 dark:border-gray-500 dark:text-gray-400">
            No-op
          </Badge>
        )
    }
  }

  return (
    <Card className="futuristic-panel neon-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="neon-text-cyan">Plan Comparison</CardTitle>
            <CardDescription>
              Terraform {plan.terraform_version} • {plan.resourceChanges.length} resources
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="border-green-300 text-green-600 dark:border-green-500 dark:text-green-400"
            >
              <Plus className="h-3 w-3 mr-1" />
              {plan.summary.add} to add
            </Badge>
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-600 dark:border-amber-500 dark:text-amber-400"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {plan.summary.change} to change
            </Badge>
            <Badge variant="outline" className="border-red-300 text-red-600 dark:border-red-500 dark:text-red-400">
              <Minus className="h-3 w-3 mr-1" />
              {plan.summary.destroy} to destroy
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-4 bg-gray-100 dark:bg-secondary">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="create" className="text-green-600 dark:text-green-400">
                Create
              </TabsTrigger>
              <TabsTrigger value="update" className="text-amber-600 dark:text-amber-400">
                Update
              </TabsTrigger>
              <TabsTrigger value="delete" className="text-red-600 dark:text-red-400">
                Delete
              </TabsTrigger>
            </TabsList>

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
          </div>

          <TabsContent value="all" className="mt-0">
            <ResourceTable resources={filteredResources} getActionBadge={getActionBadge} />
          </TabsContent>
          <TabsContent value="create" className="mt-0">
            <ResourceTable resources={filteredResources} getActionBadge={getActionBadge} />
          </TabsContent>
          <TabsContent value="update" className="mt-0">
            <ResourceTable resources={filteredResources} getActionBadge={getActionBadge} />
          </TabsContent>
          <TabsContent value="delete" className="mt-0">
            <ResourceTable resources={filteredResources} getActionBadge={getActionBadge} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface ResourceTableProps {
  resources: ResourceChange[]
  getActionBadge: (action: string) => React.ReactNode
}

function ResourceTable({ resources, getActionBadge }: ResourceTableProps) {
  return (
    <div className="rounded-md border border-blue-200 dark:border-neon-cyan/20 overflow-hidden">
      <Table>
        <TableHeader className="bg-blue-50 dark:bg-neon-cyan/5">
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Module</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                No resources found
              </TableCell>
            </TableRow>
          ) : (
            resources.map((resource) => (
              <TableRow key={resource.address} className="hover:bg-blue-50/50 dark:hover:bg-neon-cyan/5">
                <TableCell>{getActionBadge(resource.action)}</TableCell>
                <TableCell className="font-medium neon-text-cyan">{resource.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-purple-300 text-purple-600 dark:border-neon-purple/50 dark:text-neon-purple"
                  >
                    {resource.type}
                  </Badge>
                </TableCell>
                <TableCell>{resource.provider}</TableCell>
                <TableCell>{resource.module || "root"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
