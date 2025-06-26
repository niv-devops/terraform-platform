"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, FileUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseTerraformPlan } from "@/lib/terraform-plan"
import type { TerraformPlan } from "@/lib/types"

interface PlanUploadProps {
  onPlanLoaded: (plan: TerraformPlan) => void
}

export function PlanUpload({ onPlanLoaded }: PlanUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setError(null)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    // Check if it's a .tfplan file or JSON
    if (!file.name.endsWith(".tfplan") && !file.name.endsWith(".json")) {
      setError("Please upload a .tfplan or .json file")
      setFile(null)
      return
    }

    setFile(file)
    setIsLoading(true)

    try {
      const plan = await parseTerraformPlan(file)
      onPlanLoaded(plan)
    } catch (err) {
      console.error("Failed to parse plan file:", err)
      setError(err instanceof Error ? err.message : "Failed to parse plan file")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearFile = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="futuristic-panel neon-border">
      <CardHeader>
        <CardTitle className="neon-text-cyan">Upload Terraform Plan</CardTitle>
        <CardDescription>Upload a plan.tfplan file to compare desired vs current state</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            "hover:bg-blue-50/50 dark:hover:bg-neon-cyan/5",
            isDragging
              ? "border-blue-500 bg-blue-50/80 dark:border-neon-cyan dark:bg-neon-cyan/10"
              : "border-gray-300 dark:border-gray-700",
            file ? "bg-blue-50/50 dark:bg-neon-cyan/5" : "",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".tfplan,.json" />

          {isLoading ? (
            <div className="py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-neon-cyan mx-auto mb-4"></div>
              <p className="text-muted-foreground">Parsing plan file...</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center mb-2">
                <FileUp className="h-6 w-6 text-blue-500 dark:text-neon-cyan mr-2" />
                <span className="font-medium">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClearFile()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Click to upload a different file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-blue-500 dark:text-neon-cyan mb-2" />
              <p className="font-medium mb-1">Drag and drop your plan file here</p>
              <p className="text-sm text-muted-foreground mb-2">or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports .tfplan and .json files</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
