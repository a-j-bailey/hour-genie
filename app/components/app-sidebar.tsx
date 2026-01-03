"use client"

import * as React from "react"
import {
  Clock,
  Frame,
  Plug,
  Settings2,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
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
