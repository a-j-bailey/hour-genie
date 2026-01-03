"use client"

import * as React from "react"
import {
  Clock,
  Frame,
  Plug,
  Settings2,
  Sparkles,
} from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { NavProjects } from "~/components/nav-projects"
import { NavUser } from "~/components/nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "~/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Hour Management",
      url: "/dashboard",
      icon: Clock,
      isActive: false,
    },
    {
      title: "Integrations",
      url: "/integrations",
      icon: Plug,
      isActive: false,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      isActive: false,
    },
  ],
  projects: [
    {
      name: "Dashboard",
      url: "/account",
      icon: Frame,
    },
  ],
}

function SidebarTitle() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="flex items-center gap-2 px-2 py-3">
      <div className="relative flex items-center justify-center">
        <Clock className="size-5 text-sidebar-foreground" />
        <Sparkles className="absolute -right-0.5 -top-0.5 size-3 text-sidebar-primary" />
      </div>
      {!isCollapsed && (
        <span className="text-sidebar-foreground font-semibold text-base">
          HourGenie
        </span>
      )}
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarTitle />
        <SidebarSeparator />
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
