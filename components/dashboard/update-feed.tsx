import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Update {
    id: string;
    project: string;
    description: string;
    date: string;
    type: "success" | "warning" | "destructive" | "neutral";
}

interface UpdateFeedProps {
    updates: Update[];
    className?: string;
}

export function UpdateFeed({ updates, className }: UpdateFeedProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <h3 className="text-lg font-semibold tracking-tight">Últimas Atualizações</h3>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <div className="space-y-4">
                    {updates.map((update) => (
                        <div key={update.id} className="flex gap-4 border-b pb-4 last:border-0">
                            <div
                                className={cn(
                                    "h-2 w-2 mt-2 rounded-full shrink-0",
                                    {
                                        "bg-green-500": update.type === "success",
                                        "bg-yellow-500": update.type === "warning",
                                        "bg-red-500": update.type === "destructive",
                                        "bg-gray-500": update.type === "neutral",
                                    }
                                )}
                            />
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{update.project}</p>
                                <p className="text-sm text-muted-foreground">{update.description}</p>
                                <p className="text-xs text-muted-foreground opacity-70">{update.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
