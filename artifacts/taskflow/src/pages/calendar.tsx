import { useListTasks } from "@workspace/api-client-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, parseISO } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskDetailDialog } from "@/components/task-detail-dialog";

export default function CalendarPage() {
  const { data: tasks } = useListTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for grid
  const startDay = monthStart.getDay();
  const paddingDays = Array.from({ length: startDay }).map((_, i) => null);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const today = () => setCurrentDate(new Date());

  const getTasksForDay = (date: Date) => {
    return tasks?.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), date)) || [];
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden p-6 gap-6">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={today}>Today</Button>
          <div className="flex items-center border border-border rounded-md bg-card">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r border-border" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-36 text-center font-medium text-sm">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-l border-border" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col border border-border rounded-xl overflow-hidden bg-card/50 shadow-sm">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto">
          {paddingDays.map((_, i) => (
            <div key={`padding-\${i}`} className="border-r border-b border-border bg-muted/10" />
          ))}
          
          {daysInMonth.map(day => {
            const dayTasks = getTasksForDay(day);
            const isCurrentToday = isToday(day);
            
            return (
              <div 
                key={day.toISOString()} 
                className={`min-h-[100px] border-r border-b border-border p-2 flex flex-col gap-1 \${isCurrentToday ? 'bg-primary/5' : ''}`}
              >
                <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full \${isCurrentToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {format(day, "d")}
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1 mt-1 custom-scrollbar">
                  {dayTasks.map(task => {
                    const overdue = isPast(day) && !isCurrentToday && task.status !== 'done';
                    return (
                      <div 
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`text-[10px] px-1.5 py-1 rounded cursor-pointer truncate font-medium border \${
                          task.status === 'done' ? 'bg-green-500/10 text-green-500 border-green-500/20 line-through opacity-70' :
                          overdue ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          'bg-card text-card-foreground border-border hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        {task.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {/* Fill remaining cells */}
          {Array.from({ length: (7 - (daysInMonth.length + startDay) % 7) % 7 }).map((_, i) => (
             <div key={`end-padding-\${i}`} className="border-r border-b border-border bg-muted/10" />
          ))}
        </div>
      </div>

      <TaskDetailDialog 
        taskId={selectedTaskId} 
        open={!!selectedTaskId} 
        onOpenChange={(o) => !o && setSelectedTaskId(null)} 
      />
    </div>
  );
}