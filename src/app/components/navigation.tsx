"use client";

import type { LucideIcon } from "lucide-react";
import {
  Binary,
  CalendarDays,
  CloudSun,
  Compass,
  Film,
  Image,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Network,
  Newspaper,
  Orbit,
  PenLine,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUpDown,
  UserCircle,
  Users,
} from "lucide-react";

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  adminOnly?: boolean;
  userOnly?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/**
 * Single source of truth for the dashboard shell. Every backend module that
 * has a UI surface is mapped here; add a new entry when a router gains one.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "command",
    label: "Command",
    items: [
      {
        id: "dashboard",
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Latest transit story and active planetary drivers",
      },
      {
        id: "climate",
        href: "/climate",
        label: "Cosmic Climate",
        icon: CloudSun,
        description: "Aggregate chart climate, vitals, and story pulse",
      },
      {
        id: "parliament",
        href: "/parliament",
        label: "Planetary Parliament",
        icon: Users,
        description: "Planet voting deck and dominant weather drivers",
      },
    ],
  },
  {
    id: "natal",
    label: "Natal Engine",
    items: [
      {
        id: "nativity",
        href: "/nativity",
        label: "Nativity Archive",
        icon: Orbit,
        description: "Create and inspect nativity charts and their cast",
      },
      {
        id: "timeline",
        href: "/dashboard/timeline",
        label: "Timeline Matrix",
        icon: CalendarDays,
        description: "Vedha intensity, retro volatility, and Sarvatobhadra",
      },
      {
        id: "tension",
        href: "/tension",
        label: "Tension Network",
        icon: Network,
        description: "Aspect pressure network and exactness ranking",
      },
      {
        id: "evolution",
        href: "/evolution",
        label: "State Evolution",
        icon: LineChart,
        description: "Daily latent-state evolution across the transit window",
      },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      {
        id: "narrative",
        href: "/terminal/narrative",
        label: "Narrative Engine",
        icon: MessageSquare,
        description: "Compiled story narrative and planetary scenes",
      },
      {
        id: "vector",
        href: "/terminal/vector",
        label: "Vector Explorer",
        icon: Compass,
        description: "54-axis latent vectors and chart aggregates",
      },
      {
        id: "similar",
        href: "/terminal/similar",
        label: "Similar States",
        icon: Binary,
        description: "Historic market states nearest the current regime",
      },
      {
        id: "operator",
        href: "/terminal/operator",
        label: "Operator Lab",
        icon: Radio,
        description: "Persisted market states, signals, and event logs",
      },
    ],
  },
  {
    id: "market",
    label: "Market",
    items: [
      {
        id: "market",
        href: "/market",
        label: "Market Terminal",
        icon: TrendingUpDown,
        description: "Astro-conditioned market inference and charting",
      },
    ],
  },
  {
    id: "studio",
    label: "Studio",
    items: [
      {
        id: "studio",
        href: "/studio",
        label: "Publishing Studio",
        icon: PenLine,
        description: "Compose and publish analyst ideas",
      },
      {
        id: "ideas",
        href: "/ideas",
        label: "Ideas Feed",
        icon: Newspaper,
        description: "Public analyst and astro-reading feed",
      },
      {
        id: "image",
        href: "/image",
        label: "Image Lab",
        icon: Image,
        description: "Generate visual artefacts from chart prompts",
      },
      {
        id: "viz",
        href: "/viz",
        label: "Latent Viz",
        icon: Sparkles,
        description: "Interactive latent-space visualizer",
      },
      {
        id: "viz-animated",
        href: "/viz-animated",
        label: "Animated Viz",
        icon: Film,
        description: "Animated latent-space exploration",
      },
    ],
  },
  {
    id: "superadmin",
    label: "Super Admin",
    items: [
      {
        id: "admin-control",
        href: "/admin/control",
        label: "Control Room",
        icon: ShieldCheck,
        description: "Top-down control of every platform domain",
        adminOnly: true,
      },
      {
        id: "admin-profile",
        href: "/profile-selection",
        label: "Profile Selection",
        icon: UserCircle,
        description: "Choose the active nativity profile",
        adminOnly: true,
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "profile",
        href: "/profile-selection",
        label: "Profile Selection",
        icon: UserCircle,
        description: "Choose the active nativity profile",
        userOnly: true,
      },
    ],
  },
];
