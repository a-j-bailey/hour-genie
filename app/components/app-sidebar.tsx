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
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "~/components/ui/sidebar"
import { Separator } from "./ui/separator"

const data = {
  navMain: [
    {
      title: "Hour Management",
      url: "/hours",
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
    // {
    //   name: "Dashboard",
    //   url: "/account",
    //   icon: Frame,
    // },
  ],
}

function SidebarTitle() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:p-0!">
      <div className="relative flex items-center justify-center rounded-lg">
        <img
          src="/imgs/logos/hg_logo.png"
          alt="HourGenie"
          className="size-8 object-contain rounded-lg"
        />
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
        <Separator />
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <Separator />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
