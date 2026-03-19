import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface ProjectFiltersProps {
    onSearchChange: (value: string) => void;
    onSectorChange: (value: string) => void;
    onStatusChange: (value: string) => void;
}

export function ProjectFilters({
    onSearchChange,
    onSectorChange,
    onStatusChange,
}: ProjectFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar projetos..."
                    className="pl-8"
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            <Select onValueChange={onSectorChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                    <SelectItem value="cultura">Cultura</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={onStatusChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Não Iniciada">Não Iniciada</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Elaboração">Elaboração</SelectItem>
                    <SelectItem value="Viabilização">Viabilização</SelectItem>
                    <SelectItem value="Contratação">Contratação</SelectItem>
                    <SelectItem value="Execução">Execução</SelectItem>
                    <SelectItem value="Executada">Executada</SelectItem>
                    <SelectItem value="Prestação de Contas">Prestação de Contas</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
