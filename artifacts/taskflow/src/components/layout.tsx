import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar as CalendarIcon, BarChart3, Activity as ActivityIcon, Plus, Search, Bell, Settings } from "lucide-react";
import { useListMembers } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreateTaskDialog } from "./create-task-dialog";
import { useSearch } from "@/lib/search-context";

const NAV_ITEMS = [
  { href: "/", label: "Board", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: members } = useListMembers();
  const { search, setSearch } = useSearch();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">TaskFlow</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">Views</div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-8 px-2">Team</div>
          <div className="space-y-1">
            {members?.map(member => (
              <div key={member.id} className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-muted transition-colors cursor-default">
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback style={{ backgroundColor: `${member.color}33`, color: member.color }} className="text-[10px]">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  {member.online && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-sidebar" />
                  )}
                </div>
                <span className="text-sm text-sidebar-foreground truncate">{member.name}</span>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center w-full max-w-md gap-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-9 bg-muted/50 border-transparent focus-visible:bg-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="h-5 w-5" />
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </main>
      </div>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}