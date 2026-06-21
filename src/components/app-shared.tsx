import type { ReactNode } from "react";
import { LayoutGridIcon, ListChecksIcon, BarChart3Icon, MessageSquareTextIcon, UsersIcon, PlugIcon, SettingsIcon, HelpCircleIcon, ActivityIcon } from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		items: [
			{
				title: "Dashboard",
				path: "/admin",
				icon: (
					<LayoutGridIcon />
				),
				isActive: true,
			},
		],
	},
	{
		label: "Tamu",
		items: [
			{
				title: "Daftar Tamu",
				path: "/admin#tamu",
				icon: (
					<UsersIcon />
				),
			},
			{
				title: "Log Kehadiran",
				path: "/admin#kehadiran",
				icon: (
					<ListChecksIcon />
				),
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Help Center",
		path: "#/help",
		icon: (
			<HelpCircleIcon
			/>
		),
	},
	{
		title: "System status",
		path: "#/status",
		icon: (
			<ActivityIcon
			/>
		),
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...footerNavLinks,
];
