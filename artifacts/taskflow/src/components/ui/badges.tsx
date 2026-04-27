import { Priority } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = {
    high: { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" },
    medium: { label: "Medium", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    low: { label: "Low", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  };
  
  const p = config[priority];
  return (
    <Badge variant="outline" className={`\${p.className} text-[10px] px-1.5 py-0 uppercase tracking-wider font-bold`}>
      {p.label}
    </Badge>
  );
}