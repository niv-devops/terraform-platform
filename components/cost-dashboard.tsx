"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, DollarSign, Calculator, AlertTriangle, Info } from "lucide-react"
import { estimateCurrentStateCosts, formatCurrency } from "@/lib/cost-estimation"
import type { TerraformState, CostSummary } from "@/lib/types"

interface CostDashboardProps {
  terraformState: TerraformState
}

export function CostDashboard({ terraformState }: CostDashboardProps) {
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (terraformState) {
      setLoading(true)
      setError(null)
      try {
        const summary = estimateCurrentStateCosts(terraformState)
        setCostSummary(summary)
      } catch (error) {
        console.error("Error calculating costs:", error)
        setError("Unable to calculate cost estimates")
      } finally {
        setLoading(false)
      }
    }
  }, [terraformState])

  if (!terraformState) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No Terraform state data available for cost analysis.</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !costSummary) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || "Unable to calculate cost estimates for the current state."}</AlertDescription>
      </Alert>
    )
  }

  const breakdownData = [
    { name: "Compute", value: costSummary.breakdown.compute, color: "bg-blue-500" },
    { name: "Database", value: costSummary.breakdown.database, color: "bg-purple-500" },
    { name: "Storage", value: costSummary.breakdown.storage, color: "bg-green-500" },
    { name: "Network", value: costSummary.breakdown.network, color: "bg-orange-500" },
    { name: "Other", value: costSummary.breakdown.other, color: "bg-gray-500" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <span className="font-semibold">Note:</span> Cost estimates are based on standard pricing and may not reflect
          your actual costs due to reserved instances, spot pricing, enterprise discounts, or usage patterns.
        </AlertDescription>
      </Alert>

      {/* Cost Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="futuristic-panel neon-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold neon-text-cyan">{formatCurrency(costSummary.totalMonthlyCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(costSummary.totalHourlyCost)}/hour</p>
          </CardContent>
        </Card>

        <Card className="futuristic-panel neon-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Annual Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold neon-text-purple">
              {formatCurrency(costSummary.totalMonthlyCost * 12)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on current usage</p>
          </CardContent>
        </Card>

        <Card className="futuristic-panel neon-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold neon-text-pink">{costSummary.resourceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Billable resources</p>
          </CardContent>
        </Card>

        <Card className="futuristic-panel neon-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold neon-text-green">
              {formatCurrency(costSummary.totalMonthlyCost / Math.max(costSummary.resourceCount, 1))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 bg-gray-100 dark:bg-secondary">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="resources">Resource Costs</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown Chart */}
            <Card className="futuristic-panel neon-border">
              <CardHeader>
                <CardTitle className="neon-text-cyan">Cost Breakdown by Category</CardTitle>
                <CardDescription>Monthly cost distribution across service categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {breakdownData.length > 0 ? (
                  breakdownData.map((item) => {
                    const percentage = (item.value / costSummary.totalMonthlyCost) * 100
                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(item.value)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-muted-foreground">No cost breakdown available</p>
                )}
              </CardContent>
            </Card>

            {/* Top Cost Resources */}
            <Card className="futuristic-panel neon-border">
              <CardHeader>
                <CardTitle className="neon-text-purple">Top Cost Resources</CardTitle>
                <CardDescription>Resources with highest monthly costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costSummary.estimates.length > 0 ? (
                    costSummary.estimates
                      .sort((a, b) => b.monthlyCost - a.monthlyCost)
                      .slice(0, 10)
                      .map((estimate, index) => (
                        <div
                          key={estimate.resourceAddress}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{estimate.resourceName}</p>
                            <p className="text-xs text-muted-foreground">{estimate.details}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(estimate.monthlyCost)}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                estimate.confidence === "high"
                                  ? "border-green-300 text-green-600 dark:border-green-500 dark:text-green-400"
                                  : estimate.confidence === "medium"
                                    ? "border-amber-300 text-amber-600 dark:border-amber-500 dark:text-amber-400"
                                    : "border-red-300 text-red-600 dark:border-red-500 dark:text-red-400"
                              }`}
                            >
                              {estimate.confidence}
                            </Badge>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-center text-muted-foreground">No cost estimates available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card className="futuristic-panel neon-border">
            <CardHeader>
              <CardTitle className="neon-text-cyan">All Resource Costs</CardTitle>
              <CardDescription>Detailed cost breakdown for all billable resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {costSummary.estimates.length > 0 ? (
                  costSummary.estimates.map((estimate) => (
                    <div
                      key={estimate.resourceAddress}
                      className="flex items-center justify-between p-3 rounded-md border border-blue-200 dark:border-neon-cyan/20 hover:bg-blue-50/50 dark:hover:bg-neon-cyan/5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{estimate.resourceName}</p>
                          <Badge variant="outline" className="text-xs">
                            {estimate.resourceType}
                          </Badge>
                          {estimate.instanceType && (
                            <Badge
                              variant="outline"
                              className="text-xs border-purple-300 text-purple-600 dark:border-neon-purple/50 dark:text-neon-purple"
                            >
                              {estimate.instanceType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{estimate.details}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(estimate.monthlyCost)}/mo</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(estimate.hourlyCost)}/hr</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No billable resources found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="futuristic-panel neon-border">
              <CardHeader>
                <CardTitle className="neon-text-green">Cost Optimization Opportunities</CardTitle>
                <CardDescription>Potential ways to reduce your infrastructure costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Reserved Instances</h4>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Consider reserved instances for long-running workloads. Potential savings: 30-60%
                  </p>
                </div>

                <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Right-sizing</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Monitor resource utilization and downsize underutilized instances
                  </p>
                </div>

                <div className="p-4 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Spot Instances</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    Use spot instances for fault-tolerant workloads. Potential savings: 50-90%
                  </p>
                </div>

                <div className="p-4 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Storage Optimization</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400">
                    Use appropriate storage classes and implement lifecycle policies
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="futuristic-panel neon-border">
              <CardHeader>
                <CardTitle className="neon-text-pink">Cost Trends & Alerts</CardTitle>
                <CardDescription>Monitor your infrastructure spending patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300">Budget Alert</h4>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Set up budget alerts to monitor spending and avoid unexpected costs
                  </p>
                </div>

                <div className="p-4 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-300">Cost Tracking</h4>
                  </div>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    Track cost changes over time to identify spending trends
                  </p>
                </div>

                <div className="p-4 rounded-md bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-teal-600" />
                    <h4 className="font-semibold text-teal-800 dark:text-teal-300">Cost Allocation</h4>
                  </div>
                  <p className="text-sm text-teal-700 dark:text-teal-400">
                    Use tags to allocate costs to teams, projects, or environments
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
