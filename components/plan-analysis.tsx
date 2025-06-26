"use client"

import { useState } from "react"
import { PlanUpload } from "@/components/plan-upload"
import { PlanComparison } from "@/components/plan-comparison"
import { PlanCostComparison } from "@/components/plan-cost-comparison"
import { ResourceDiff } from "@/components/resource-diff"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { TerraformPlan, TerraformState, ResourceChange } from "@/lib/types"

interface PlanAnalysisProps {
  currentState?: TerraformState
}

export function PlanAnalysis({ currentState }: PlanAnalysisProps) {
  const [plan, setPlan] = useState<TerraformPlan | null>(null)
  const [selectedResource, setSelectedResource] = useState<ResourceChange | null>(null)

  const handlePlanLoaded = (loadedPlan: TerraformPlan) => {
    setPlan(loadedPlan)
    // Select the first resource by default if available
    if (loadedPlan.resourceChanges.length > 0) {
      setSelectedResource(loadedPlan.resourceChanges[0])
    }
  }

  if (!plan) {
    return <PlanUpload onPlanLoaded={handlePlanLoaded} />
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <span className="font-semibold">Tip:</span> To generate a plan JSON file, run:{" "}
          <code className="bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">
            terraform plan -out=plan.tfplan &amp;&amp; terraform show -json plan.tfplan &gt; plan.json
          </code>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 bg-gray-100 dark:bg-secondary">
          <TabsTrigger value="overview">Plan Overview</TabsTrigger>
          <TabsTrigger value="costs">Cost Impact</TabsTrigger>
          <TabsTrigger value="details">Resource Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <PlanComparison plan={plan} />
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <PlanCostComparison plan={plan} currentState={currentState} />
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PlanComparison plan={plan} />
            </div>
            <div>
              {selectedResource ? (
                <ResourceDiff resource={selectedResource} />
              ) : (
                <Card className="futuristic-panel border-dashed border-blue-300 dark:border-neon-cyan/30">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Resource Selected</h3>
                    <p className="text-muted-foreground text-center">
                      Select a resource from the list to view its changes
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
