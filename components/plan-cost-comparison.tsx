"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, DollarSign, Plus, Minus, RefreshCw, AlertTriangle } from "lucide-react"
import { estimatePlannedStateCosts, formatCurrency, formatPercentage } from "@/lib/cost-estimation"
import type { TerraformState, TerraformPlan, CostComparison } from "@/lib/types"

interface PlanCostComparisonProps {
  plan: TerraformPlan
  currentState?: TerraformState
}

export function PlanCostComparison({ plan, currentState }: PlanCostComparisonProps) {
  const [costComparison, setCostComparison] = useState<CostComparison | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (plan) {
      setLoading(true)
      try {
        const comparison = estimatePlannedStateCosts(plan, currentState)
        setCostComparison(comparison)
      } catch (error) {
        console.error("Error calculating cost comparison:", error)
      } finally {
        setLoading(false)
      }
    }
  }, [plan, currentState])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!costComparison) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Unable to calculate cost comparison for the plan.</AlertDescription>
      </Alert>
    )
  }

  const isIncrease = costComparison.difference.monthly > 0
  const isDecrease = costComparison.difference.monthly < 0

  return (
    <div className="space-y-6">
      {/* Cost Impact Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="futuristic-panel neon-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Current Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold neon-text-cyan">
              {formatCurrency(costComparison.current.totalMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{costComparison.current.resourceCount} resources</p>
          </CardContent>
        </Card>

        <Card className="futuristic-panel neon-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Planned Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold neon-text-purple">
              {formatCurrency(costComparison.planned.totalMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{costComparison.planned.resourceCount} resources</p>
          </CardContent>
        </Card>

        <Card
          className={`futuristic-panel ${isIncrease ? "border-red-200 dark:border-red-800" : isDecrease ? "border-green-200 dark:border-green-800" : ""}`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              {isIncrease ? (
                <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
              ) : isDecrease ? (
                <TrendingDown className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Cost Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isIncrease ? "text-red-500" : isDecrease ? "text-green-500" : "neon-text-pink"
              }`}
            >
              {costComparison.difference.monthly >= 0 ? "+" : ""}
              {formatCurrency(costComparison.difference.monthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercentage(costComparison.difference.percentage)} change
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Added Resources */}
        <Card className="futuristic-panel neon-border">
          <CardHeader>
            <CardTitle className="neon-text-green flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Resources to Add ({costComparison.changedResources.added.length})
            </CardTitle>
            <CardDescription>New resources that will increase costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costComparison.changedResources.added.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resources will be added</p>
              ) : (
                costComparison.changedResources.added.map((resource) => (
                  <div
                    key={resource.resourceAddress}
                    className="flex items-center justify-between p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.resourceName}</p>
                      <p className="text-xs text-muted-foreground">{resource.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">+{formatCurrency(resource.monthlyCost)}</p>
                    </div>
                  </div>
                ))
              )}
              {costComparison.changedResources.added.length > 0 && (
                <div className="pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-600">
                    Total: +
                    {formatCurrency(costComparison.changedResources.added.reduce((sum, r) => sum + r.monthlyCost, 0))}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Removed Resources */}
        <Card className="futuristic-panel neon-border">
          <CardHeader>
            <CardTitle className="neon-text-red flex items-center">
              <Minus className="h-4 w-4 mr-2" />
              Resources to Remove ({costComparison.changedResources.removed.length})
            </CardTitle>
            <CardDescription>Resources that will be destroyed, reducing costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costComparison.changedResources.removed.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resources will be removed</p>
              ) : (
                costComparison.changedResources.removed.map((resource) => (
                  <div
                    key={resource.resourceAddress}
                    className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.resourceName}</p>
                      <p className="text-xs text-muted-foreground">{resource.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">-{formatCurrency(resource.monthlyCost)}</p>
                    </div>
                  </div>
                ))
              )}
              {costComparison.changedResources.removed.length > 0 && (
                <div className="pt-2 border-t border-red-200 dark:border-red-800">
                  <p className="text-sm font-semibold text-red-600">
                    Total: -
                    {formatCurrency(costComparison.changedResources.removed.reduce((sum, r) => sum + r.monthlyCost, 0))}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modified Resources */}
        <Card className="futuristic-panel neon-border">
          <CardHeader>
            <CardTitle className="neon-text-amber flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Resources to Modify ({costComparison.changedResources.modified.length})
            </CardTitle>
            <CardDescription>Resources that will be updated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costComparison.changedResources.modified.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resources will be modified</p>
              ) : (
                costComparison.changedResources.modified.map((resource) => (
                  <div
                    key={resource.resourceAddress}
                    className="flex items-center justify-between p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resource.resourceName}</p>
                      <p className="text-xs text-muted-foreground">{resource.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(resource.monthlyCost)}</p>
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-300 text-amber-600 dark:border-amber-500 dark:text-amber-400"
                      >
                        Modified
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Impact Alert */}
      {Math.abs(costComparison.difference.monthly) > 100 && (
        <Alert
          className={`${
            isIncrease
              ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30"
              : "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30"
          }`}
        >
          {isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <AlertDescription>
            <span className="font-semibold">{isIncrease ? "Cost Increase Alert:" : "Cost Savings:"}</span> This plan
            will {isIncrease ? "increase" : "decrease"} your monthly costs by{" "}
            <span className="font-semibold">{formatCurrency(Math.abs(costComparison.difference.monthly))}</span> (
            {formatPercentage(Math.abs(costComparison.difference.percentage))}).
            {isIncrease && " Please review the changes carefully before applying."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
