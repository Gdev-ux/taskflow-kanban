import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useGetTask, useUpdateTask, useDeleteTask, useCreateComment, useListMembers, getListTasksQueryKey, getGetBoardSummaryQueryKey, getGetTaskQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2, MessageSquare, Tag, Calendar, User, AlignLeft, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PriorityBadge } from "./ui/badges";

export function TaskDetailDialog({ taskId, open, onOpenChange }: { taskId: number | null, open: boolean, onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: members } = useListMembers();
  
  const { data: task, isLoading } = useGetTask(taskId as number, { 
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(taskId as number) } 
  });
  
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createComment = useCreateComment();
  
  const [commentText, setCommentText] = useState("");
  const [descEditing, setDescEditing] = useState(false);
  const [descValue, setDescValue] = useState("");
  
  useEffect(() => {
    if (task && !descEditing) {
      setDescValue(task.description);
    }
  }, [task, descEditing]);

  const handleUpdate = (data: any) => {
    if (!taskId) return;
    updateTask.mutate({ id: taskId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBoardSummaryQueryKey() });
      }
    });
  };

  const handleDescSave = () => {
    setDescEditing(false);
    if (descValue !== task?.description) {
      handleUpdate({ description: descValue });
    }
  };

  const handleDelete = () => {
    if (!taskId) return;
    deleteTask.mutate({ id: taskId }, {
      onSuccess: () => {
        toast({ title: "Task deleted" });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetBoardSummaryQueryKey() });
        onOpenChange(false);
      }
    });
  };

  const handleAddComment = () => {
    if (!taskId || !commentText.trim()) return;
    createComment.mutate({ id: taskId, data: { text: commentText } }, {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
      }
    });
  };

  if (!open || !taskId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card text-card-foreground flex flex-col max-h-[85vh]">
        {isLoading || !task ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Select value={task.status} onValueChange={(val) => handleUpdate({ status: val })}>
                    <SelectTrigger className="h-8 text-xs font-semibold uppercase tracking-wider w-auto border-none bg-muted hover:bg-muted/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={task.priority} onValueChange={(val) => handleUpdate({ priority: val })}>
                    <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted/50 w-auto shadow-none p-0 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high"><PriorityBadge priority="high" /></SelectItem>
                      <SelectItem value="medium"><PriorityBadge priority="medium" /></SelectItem>
                      <SelectItem value="low"><PriorityBadge priority="low" /></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <Input 
                className="text-xl font-bold px-0 h-auto border-none shadow-none focus-visible:ring-0 bg-transparent"
                defaultValue={task.title}
                onBlur={(e) => {
                  if (e.target.value !== task.title && e.target.value.trim()) {
                    handleUpdate({ title: e.target.value });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
              />
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <AlignLeft className="h-4 w-4" /> Description
                  </div>
                  {descEditing ? (
                    <div className="space-y-2">
                      <Textarea 
                        value={descValue}
                        onChange={(e) => setDescValue(e.target.value)}
                        className="min-h-[100px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleDescSave}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDescEditing(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="text-sm whitespace-pre-wrap hover:bg-muted/30 p-2 -mx-2 rounded-md cursor-pointer min-h-[60px]"
                      onClick={() => setDescEditing(true)}
                    >
                      {task.description || <span className="text-muted-foreground italic">Add a more detailed description...</span>}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    <MessageSquare className="h-4 w-4" /> Comments ({task.comments?.length || 0})
                  </div>
                  
                  <div className="space-y-4">
                    {task.comments?.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-0.5">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {comment.authorName?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{comment.authorName || "User"}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-sm text-card-foreground bg-muted/40 p-2.5 rounded-lg rounded-tl-none border border-border">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 items-start mt-4">
                    <Textarea 
                      placeholder="Write a comment..." 
                      className="min-h-[60px] resize-none text-sm"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button size="icon" onClick={handleAddComment} disabled={!commentText.trim() || createComment.isPending} className="flex-shrink-0 mt-1">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="w-full md:w-48 space-y-6 flex-shrink-0 bg-muted/10 p-4 rounded-xl border border-border">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Assignee
                  </label>
                  <Select 
                    value={task.assigneeId?.toString() || "0"} 
                    onValueChange={(val) => handleUpdate({ assigneeId: val === "0" ? null : parseInt(val) })}
                  >
                    <SelectTrigger className="h-8 text-sm bg-transparent border-transparent hover:bg-muted/50 p-1">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Unassigned</SelectItem>
                      {members?.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Due Date
                  </label>
                  <Input 
                    type="date" 
                    value={task.dueDate || ""} 
                    onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
                    className="h-8 text-sm bg-transparent border-transparent hover:bg-muted/50 p-1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {task.tags?.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Input 
                    placeholder="Add tags..." 
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val && !task.tags?.includes(val)) {
                          handleUpdate({ tags: [...(task.tags || []), val] });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}