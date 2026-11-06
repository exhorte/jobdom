import { Bot, BriefcaseBusiness, FileText, House, Inbox, Rocket, Search, Settings, UserRound, type LucideIcon } from "lucide-react";
import { tx } from "@/lib/i18n";

// The app's sections, shared by the sidebar and the page bar so they always agree.

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Whether the item is the current section; defaults to its own path and below. */
  isActive?: (pathname: string) => boolean;
};

const within = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/** The sections in groups; the last group sits at the bottom. */
export const NAV: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: "/", label: tx("Dashboard"), icon: House, isActive: (pathname) => pathname === "/" }] },
  {
    label: tx("You"),
    items: [
      { href: "/profile", label: tx("Profile"), icon: UserRound },
      { href: "/resume", label: tx("Base resume"), icon: FileText },
    ],
  },
  {
    label: tx("Job search"),
    items: [
      { href: "/jobs", label: tx("Find jobs"), icon: Search },
      { href: "/startups", label: tx("Startups"), icon: Rocket },
      { href: "/agent", label: tx("Agent"), icon: Bot },
      {
        href: "/applications",
        label: tx("Applications"),
        icon: BriefcaseBusiness,
        // A new application becomes one, so the flow belongs to Applications.
        isActive: (pathname) => within(pathname, "/applications") || within(pathname, "/new"),
      },
      { href: "/inbox", label: tx("Inbox"), icon: Inbox },
    ],
  },
  { items: [{ href: "/settings", label: tx("Settings"), icon: Settings }] },
];

export const isCurrent = ({ href, isActive = (path) => within(path, href) }: NavItem, pathname: string) => isActive(pathname);

/** The section a path belongs to, for the page bar's title; undefined outside them all. */
export function currentSection(pathname: string): NavItem | undefined {
  return NAV.flatMap((group) => group.items).find((item) => isCurrent(item, pathname));
}
