"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Cloud,
  DollarSign,
  FileText,
  GitBranch,
  Home,
  Package,
  Boxes,
  Cog,
  ListChecks,
  SquarePlus,
} from "lucide-react"

interface SidebarProps {
  onNavigate: (section: string) => void
  activeSection: string
}

export function Sidebar({ onNavigate, activeSection }: SidebarProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className={cn(
        "glass-sidebar relative flex flex-col border-r transition-all duration-300 ease-in-out",
        expanded ? "w-64" : "w-16",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-blue-200 dark:border-neon-cyan/20">
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
            <img
              src="/terraform.png?height=32&width=32"
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                const container = target.parentElement!
                container.className =
                  "w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-neon-cyan dark:to-neon-purple flex items-center justify-center text-white dark:text-primary-foreground"
                target.style.display = "none"
                target.nextElementSibling!.classList.remove("hidden")
              }}
            />
            <span className="text-white dark:text-primary-foreground text-sm font-bold hidden">TF</span>
          </div>
          {expanded && (
            <span className="text-blue-600 dark:text-neon-cyan">Environment Manager</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full border bg-background glass-button-hover"
          onClick={() => setExpanded(!expanded)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "rotate-0")}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Button>
      </div>
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 py-2">
          <h2
            className={cn(
              "mb-2 px-4 text-lg font-bold tracking-tight glass-text-gradient",
              !expanded && "sr-only"
            )}
          >
            Navigation
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "dashboard" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("dashboard")}
            >
              <Home className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Dashboard</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "resources" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("resources")}
            >
              <Boxes className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Resources</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "modules" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("modules")}
            >
              <Package className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Modules</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "providers" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("providers")}
            >
              <Cloud className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Providers</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "graph" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("graph")}
            >
              <GitBranch className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Graph View</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "state" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("state")}
            >
              <FileText className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>State Info</span>}
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2
            className={cn(
              "mb-2 px-4 text-lg font-bold tracking-tight glass-text-gradient",
              !expanded && "sr-only"
            )}
          >
            Analysis
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "costs" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("costs")}
            >
              <DollarSign className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Cost Analysis</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "plan" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("plan")}
            >
              <ListChecks className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Plan Analysis</span>}
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2
            className={cn(
              "mb-2 px-4 text-lg font-bold tracking-tight glass-text-gradient",
              !expanded && "sr-only"
            )}
          >
            Configuration
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "config" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("config")}
            >
              <Cog className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Infrastructure</span>}
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start glass-nav-item",
                activeSection === "provisioning" && "glass-nav-item-active"
              )}
              onClick={() => onNavigate("provisioning")}
            >
              <SquarePlus className={cn("h-4 w-4", expanded && "mr-2")} />
              {expanded && <span>Provisioning</span>}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
