import { useGetBoardActivity } from "@workspace/api-client-react";
import { format, isSameDay } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, MessageSquare, ArrowRightLeft, CheckCircle2 } from "lucide-react";

export default function ActivityPage() {
  const { data: activities } = useGetBoardActivity({ limit: 50 });

  // Group activities by day
  const groupedActivities: { [key: string]: typeof activities } = {};
  
  activities?.forEach(activity => {
    const dateStr = format(new Date(activity.createdAt), "yyyy-MM-dd");
    if (!groupedActivities[dateStr]) groupedActivities[dateStr] = [];
    groupedActivities[dateStr]?.push(activity);
  });

  const getIcon = (kind: string) => {
    switch (kind) {
      case "created": return <PlusCircle className="h-4 w-4 text-blue-500" />;
      case "commented": return <MessageSquare className="h-4 w-4 text-primary" />;
      case "moved": return <ArrowRightLeft className="h-4 w-4 text-amber-500" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <div className="h-2 w-2 rounded-full bg-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto p-6 max-w-4xl mx-auto w-full custom-scrollbar">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Activity Feed</h1>

      <div className="space-y-8">
        {Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date} className="relative">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {format(new Date(date), "EEEE, MMMM d")}
              </h2>
            </div>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {dayActivities?.map(activity => (
                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {getIcon(activity.kind)}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback style={{ backgroundColor: `${activity.actorColor}33`, color: activity.actorColor }} className="text-[9px]">
                            {activity.actorName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">{activity.actorName}</span>
                      </div>
                      <time className="text-xs text-muted-foreground font-mono">{format(new Date(activity.createdAt), "h:mm a")}</time>
                    </div>
                    <div className="text-sm text-card-foreground">
                      <span className="text-muted-foreground">{activity.message.replace(activity.actorName, "")}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-semibold bg-muted/50 text-muted-foreground">
                      Task: {activity.taskTitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}