import { useState, useRef, useEffect } from "react";
import { 
  useListTasks, 
  useMoveTask, 
  useListMembers, 
  useGetBoardSummary,
  getListTasksQueryKey,
  getGetBoardSummaryQueryKey,
  getGetBoardActivityQueryKey,
  Status,
  Task
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, isPast, isToday } from "date-fns";
import { Plus, MessageSquare, Clock, AlignLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskDetailDialog } from "@/components/task-detail-dialog";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { PriorityBadge } from "@/components/ui/badges";
import { useSearch } from "@/lib/search-context";

const COLUMNS = [
  { id: "todo" as Status, label: "To Do", color: "text-muted-foreground", bg: "bg-muted/5" },
  { id: "inprogress" as Status, label: "In Progress", color: "text-blue-500", bg: "bg-blue-500/5" },
  { id: "review" as Status, label: "Review", color: "text-amber-500", bg: "bg-amber-500/5" },
  { id: "done" as Status, label: "Done", color: "text-green-500", bg: "bg-green-500/5" },
];

export default function Board() {
  const queryClient = useQueryClient();
  const { search } = useSearch();
  const { data: tasks, isLoading } = useListTasks(search ? { search } : undefined);
  const { data: members } = useListMembers();
  const { data: summary } = useGetBoardSummary();
  const moveTask = useMoveTask();
  
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [createColumn, setCreateColumn] = useState<Status | null>(null);
  
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTaskId(id);
    e.dataTransfer.setData("taskId", id.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colId: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: Status) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggedTaskId(null);
    const id = parseInt(e.dataTransfer.getData("taskId"));
    if (!id || isNaN(id)) return;
    
    const task = tasks?.find(t => t.id === id);
    if (!task || task.status === colId) return;

    // Optimistic update
    queryClient.setQueryData(getListTasksQueryKey(), (old: Task[] | undefined) => {
      if (!old) return old;
      return old.map(t => t.id === id ? { ...t, status: colId } : t);
    });

    moveTask.mutate({ id, data: { status: colId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBoardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBoardActivityQueryKey() });
      },
      onError: () => {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    });
  };

  const getTasksByCol = (colId: Status) => {
    return tasks?.filter(t => t.status === colId).sort((a, b) => a.position - b.position) || [];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Stats Strip */}
      <div className="h-16 border-b border-border flex items-center px-6 gap-6 flex-shrink-0 bg-card/30 overflow-x-auto">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total</span>
          <span className="text-xl font-bold font-mono tracking-tight">{summary?.total || 0}</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">In Progress</span>
          <span className="text-xl font-bold font-mono tracking-tight text-blue-500">{summary?.byStatus.inprogress || 0}</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Done</span>
          <span className="text-xl font-bold font-mono tracking-tight text-green-500">{summary?.byStatus.done || 0}</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Overdue</span>
          <span className="text-xl font-bold font-mono tracking-tight text-destructive">{summary?.overdue || 0}</span>
        </div>
        <div className="w-px h-8 bg-border"></div>
        <div className="flex flex-col flex-1 min-w-[150px]">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Velocity</span>
            <span className="text-[10px] font-bold text-primary">{Math.round((summary?.completionRate || 0) * 100)}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${(summary?.completionRate || 0) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex h-full gap-6 min-w-max items-start">
          {COLUMNS.map(col => {
            const colTasks = getTasksByCol(col.id);
            const isDragOver = dragOverCol === col.id;
            
            return (
              <div 
                key={col.id} 
                className={`w-80 flex flex-col max-h-full rounded-xl border \${isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-sidebar/50'} transition-colors duration-200`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="p-4 flex items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full \${col.bg.replace('/5', '')}`} />
                    <h3 className="font-bold text-sm tracking-tight">{col.label}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-mono">{colTasks.length}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setCreateColumn(col.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]">
                  {isLoading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
                  ) : colTasks.length > 0 ? (
                    <AnimatePresence>
                      {colTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          layoutId={`task-\${task.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e as any, task.id)}
                          onDragEnd={() => setDraggedTaskId(null)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`bg-card border border-border p-3.5 rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all active:scale-[0.98] \${draggedTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <PriorityBadge priority={task.priority} />
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {task.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[60px]">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-sm leading-snug mb-1 line-clamp-2 text-card-foreground">{task.title}</h4>
                          
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 mt-1 flex items-start gap-1">
                              <AlignLeft className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{task.description}</span>
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-3">
                              {task.dueDate && (
                                <div className={`flex items-center gap-1 text-[10px] font-medium \${isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(task.dueDate), "MMM d")}
                                </div>
                              )}
                              {task.commentCount > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                  <MessageSquare className="h-3 w-3" />
                                  {task.commentCount}
                                </div>
                              )}
                            </div>
                            
                            {task.assigneeId && members && (
                              <Avatar className="h-6 w-6 border-2 border-card">
                                <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                                  {members.find(m => m.id === task.assigneeId)?.initials || "?"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-sm font-medium text-muted-foreground">
                      Drop tasks here
                    </div>
                  )}
                  {isDragOver && (
                    <div className="h-24 border-2 border-dashed border-primary bg-primary/5 rounded-xl flex items-center justify-center text-sm font-medium text-primary">
                      Drop to move
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailDialog 
        taskId={selectedTaskId} 
        open={!!selectedTaskId} 
        onOpenChange={(o) => !o && setSelectedTaskId(null)} 
      />
      
      <CreateTaskDialog 
        open={!!createColumn} 
        onOpenChange={(o) => !o && setCreateColumn(null)}
        defaultStatus={createColumn || "todo"}
      />
    </div>
  );
}