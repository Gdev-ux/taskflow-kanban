import { useGetBoardSummary, useGetBoardWorkload, useGetBoardActivity } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function Reports() {
  const { data: summary } = useGetBoardSummary();
  const { data: workload } = useGetBoardWorkload();
  const { data: activities } = useGetBoardActivity({ limit: 10 });

  const statusData = summary ? [
    { name: "To Do", value: summary.byStatus.todo, color: "hsl(var(--muted-foreground))" },
    { name: "In Progress", value: summary.byStatus.inprogress, color: "#3b82f6" },
    { name: "Review", value: summary.byStatus.review, color: "#f59e0b" },
    { name: "Done", value: summary.byStatus.done, color: "#22c55e" },
  ] : [];

  const priorityData = summary ? [
    { name: "High", value: summary.byPriority.high, color: "hsl(var(--destructive))" },
    { name: "Medium", value: summary.byPriority.medium, color: "#f59e0b" },
    { name: "Low", value: summary.byPriority.low, color: "#22c55e" },
  ] : [];

  const workloadData = workload?.map(w => ({
    name: w.member.name,
    active: w.active,
    done: w.done,
    initials: w.member.initials,
    color: w.member.color
  })) || [];

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto p-6 gap-6 custom-scrollbar">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/50 shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completion Rate</div>
            <div className="text-4xl font-mono font-bold text-primary">{Math.round((summary?.completionRate || 0) * 100)}%</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completed This Week</div>
            <div className="text-4xl font-mono font-bold text-green-500">{summary?.completedThisWeek || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Tasks</div>
            <div className="text-4xl font-mono font-bold">{summary?.total || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 shadow-sm border-border">
          <CardContent className="p-6">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overdue</div>
            <div className="text-4xl font-mono font-bold text-destructive">{summary?.overdue || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Chart */}
        <Card className="bg-card/50 shadow-sm border-border col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                  />
                  <Bar dataKey="active" name="Active Tasks" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="done" name="Done Tasks" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Charts */}
        <Card className="bg-card/50 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-\${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 flex-wrap mt-4">
              {statusData.map(item => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities?.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback style={{ backgroundColor: `${activity.actorColor}33`, color: activity.actorColor }} className="text-xs">
                      {activity.actorName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.actorName}</span>{" "}
                      <span className="text-muted-foreground">{activity.message}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{format(new Date(activity.createdAt), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}