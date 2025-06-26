"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TerraformState } from "@/lib/types"
import { ZoomIn, ZoomOut, Maximize, Minimize, AlertCircle } from "lucide-react"

interface ResourceGraphProps {
  terraformState: TerraformState
}

interface Node {
  id: string
  name: string
  type: string
  module?: string
  group: string
}

interface Link {
  source: string
  target: string
}

export function ResourceGraph({ terraformState }: ResourceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [d3, setD3] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    setLoading(true)
    // Dynamically import D3 only on client side
    import("d3")
      .then((d3Module) => {
        console.log("D3 loaded successfully")
        setD3(d3Module)
        setError(null)
      })
      .catch((error) => {
        console.error("Failed to load D3:", error)
        setError("Failed to load visualization library")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!svgRef.current || !terraformState || !mounted || !d3 || loading) {
      console.log("Graph render conditions not met:", {
        svgRef: !!svgRef.current,
        terraformState: !!terraformState,
        mounted,
        d3: !!d3,
        loading,
      })
      return
    }

    console.log("=== RESOURCE GRAPH RENDERING ===")
    console.log("Terraform state:", {
      resources: terraformState.resources?.length || 0,
      modules: terraformState.modules?.length || 0,
      providers: terraformState.providers?.length || 0,
    })

    try {
      // Clear previous graph
      d3.select(svgRef.current).selectAll("*").remove()

      // Prepare data for visualization
      const nodes: Node[] = []
      const links: Link[] = []
      const nodeIds = new Set<string>() // Track all valid node IDs

      // Safely access resources and modules
      const resources = terraformState.resources || []
      const modules = terraformState.modules || []

      console.log("Processing data for graph:", { resources: resources.length, modules: modules.length })

      // Add modules as nodes first and track their IDs
      modules.forEach((module, index) => {
        if (module && module.path) {
          console.log(`Adding module node: ${module.name} (${module.path})`)
          nodes.push({
            id: module.path,
            name: module.name || module.path,
            type: "module",
            group: "module",
          })
          nodeIds.add(module.path)
        }
      })

      // Add resources as nodes and track their IDs
      resources.forEach((resource, index) => {
        if (resource) {
          const nodeId = resource.id || `${resource.type || "resource"}.${resource.name || index}`
          console.log(`Adding resource node: ${resource.name} (${resource.type})`)

          nodes.push({
            id: nodeId,
            name: resource.name || `Resource ${index + 1}`,
            type: resource.type || "unknown",
            module: resource.module,
            group: "resource",
          })
          nodeIds.add(nodeId)
        }
      })

      // Now create links, but only between nodes that actually exist
      resources.forEach((resource, index) => {
        if (resource) {
          const nodeId = resource.id || `${resource.type || "resource"}.${resource.name || index}`

          // Connect resources to their modules (only if module node exists)
          if (resource.module && nodeIds.has(resource.module)) {
            console.log(`Linking resource ${nodeId} to module ${resource.module}`)
            links.push({
              source: resource.module,
              target: nodeId,
            })
          } else if (resource.module) {
            console.log(`⚠️ Module ${resource.module} referenced by ${nodeId} but module node not found`)
          }

          // Connect resources based on dependencies (only if target node exists)
          if (resource.dependencies && Array.isArray(resource.dependencies)) {
            resource.dependencies.forEach((dep) => {
              if (dep && typeof dep === "string" && nodeIds.has(dep)) {
                console.log(`Linking dependency ${nodeId} -> ${dep}`)
                links.push({
                  source: nodeId,
                  target: dep,
                })
              } else if (dep) {
                console.log(`⚠️ Dependency ${dep} referenced by ${nodeId} but target node not found`)
              }
            })
          }
        }
      })

      console.log("Graph data prepared:", {
        nodes: nodes.length,
        links: links.length,
        nodeIds: Array.from(nodeIds),
      })

      // If no nodes, show empty state
      if (nodes.length === 0) {
        console.log("No nodes to render, showing empty state")
        const svg = d3.select(svgRef.current)
        const width = svgRef.current.clientWidth || 800
        const height = svgRef.current.clientHeight || 400

        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "currentColor")
          .attr("font-size", "16px")
          .text("No resources to visualize")
        return
      }

      // Set up the SVG
      const svg = d3.select(svgRef.current)
      const width = svgRef.current.clientWidth || 800
      const height = svgRef.current.clientHeight || 400

      console.log("SVG dimensions:", { width, height })

      // Add glow filter
      const defs = svg.append("defs")
      const filter = defs
        .append("filter")
        .attr("id", "glow")
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%")

      filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur")

      const feMerge = filter.append("feMerge")
      feMerge.append("feMergeNode").attr("in", "coloredBlur")
      feMerge.append("feMergeNode").attr("in", "SourceGraphic")

      // Create a simulation with forces
      const simulation = d3
        .forceSimulation(nodes as any)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(100),
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1))

      // Create a group for the zoom behavior
      const g = svg.append("g")

      // Add zoom behavior
      const zoomBehavior = d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform)
        })

      svg.call(zoomBehavior as any)

      // Create links
      const link = g
        .append("g")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", (d: any) => {
          // Alternate between different neon colors
          const colors = ["#0ff", "#f0f", "#ff36b9", "#36b3ff"]
          return colors[Math.floor(Math.random() * colors.length)]
        })
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1)

      // Create nodes
      const node = g
        .append("g")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)

      // Add circles to nodes
      node
        .append("circle")
        .attr("r", (d: any) => (d.group === "module" ? 10 : 6))
        .attr("fill", (d: any) => (d.group === "module" ? "#f0f" : "#0ff"))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("filter", "url(#glow)")

      // Add labels to nodes
      node
        .append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text((d: any) => d.name)
        .attr("font-size", "10px")
        .attr("fill", "currentColor")

      // Add title for tooltip
      node.append("title").text((d: any) => `${d.type}: ${d.name}${d.module ? `\nModule: ${d.module}` : ""}`)

      // Update positions on each tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y)

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      })

      // Drag functions
      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged(event: any, d: any) {
        d.fx = event.x
        d.fy = event.y
      }

      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }

      console.log("Graph rendered successfully")

      return () => {
        simulation.stop()
      }
    } catch (error) {
      console.error("Error rendering graph:", error)
      setError(`Error rendering visualization: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [terraformState, mounted, d3, loading])

  const handleZoomIn = () => {
    if (!d3 || !svgRef.current) return
    setZoom((prev) => Math.min(prev + 0.1, 2))
    const svg = d3.select(svgRef.current)
    const currentTransform = d3.zoomTransform(svg.node() as any)
    svg.call((d3.zoom() as any).transform, d3.zoomIdentity.scale(currentTransform.k * 1.2))
  }

  const handleZoomOut = () => {
    if (!d3 || !svgRef.current) return
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
    const svg = d3.select(svgRef.current)
    const currentTransform = d3.zoomTransform(svg.node() as any)
    svg.call((d3.zoom() as any).transform, d3.zoomIdentity.scale(currentTransform.k / 1.2))
  }

  const toggleFullscreen = () => {
    const element = svgRef.current?.parentElement?.parentElement

    if (!isFullscreen) {
      if (element?.requestFullscreen) {
        element.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }

    setIsFullscreen(!isFullscreen)
  }

  if (loading) {
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-neon-cyan mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading graph visualization...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative h-full w-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Visualization Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!mounted || !d3) {
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-neon-cyan mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing visualization...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Slider
          value={[zoom]}
          min={0.5}
          max={2}
          step={0.1}
          className="w-24"
          onValueChange={(value) => setZoom(value[0])}
        />
        <Button variant="outline" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
      <svg ref={svgRef} className="h-full w-full" />
    </div>
  )
}
