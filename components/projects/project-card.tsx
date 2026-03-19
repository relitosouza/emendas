import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar } from "lucide-react";

interface ProjectCardProps {
    id: string;
    title: string;
    status: "Em andamento" | "Concluído" | "Parado" | "Planejamento";
    sector: string;
    budget: string;
    location: string;
    progress: number;
}

export function ProjectCard({
    id,
    title,
    status,
    sector,
    budget,
    location,
    progress,
}: ProjectCardProps) {
    const statusColor = {
        "Em andamento": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        "Concluído": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        "Parado": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        "Planejamento": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="secondary" className="mb-2">
                        {sector}
                    </Badge>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[status]}`}>
                        {status}
                    </span>
                </div>
                <CardTitle className="leading-tight text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Orçamento</p>
                    <p className="font-bold text-lg">{budget}</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full" variant="outline">
                    <Link href={`/projetos/${id}`} className="group">
                        Ver Detalhes
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
