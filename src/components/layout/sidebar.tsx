"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, DollarSign, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Finance", href: "/finance", icon: DollarSign, roles: ["Admin"] },
    { name: "Users", href: "/users", icon: Users, roles: ["Admin"] },
    { name: "Audit Log", href: "/audit", icon: Activity, roles: ["Admin"] },
];

export function Sidebar({ session }: { session?: any }) {
    const pathname = usePathname();
    const userRole = session?.user?.role || "Staff"; // fallback to Staff

    // Filter nav items based on role. If item doesn't have `roles`, it's public.
    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-zinc-950">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-3 font-semibold text-xl text-zinc-900 dark:text-zinc-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Package className="h-5 w-5" />
                    </div>
                    Freshtoria
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-4">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 rounded-full px-4 py-3 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-blue-700 dark:text-blue-400" : "text-zinc-500")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <div className="flex items-center gap-3 rounded-xl border bg-zinc-50/50 p-3 shadow-sm dark:bg-zinc-900/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400 font-bold uppercase overflow-hidden">
                        {session?.user?.image ? (
                            <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            session?.user?.name ? session.user.name.substring(0, 2) : "AD"
                        )}
                    </div>
                    <div className="flex flex-col w-[120px]">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{session?.user?.name || "Administrator"}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{session?.user?.role || "Admin"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
