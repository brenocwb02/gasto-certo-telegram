import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Filter, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TransactionControlBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    // Filters
    typeFilter: string;
    setTypeFilter: (value: string) => void;
    categoryFilter: string;
    setCategoryFilter: (value: string) => void;
    accountFilter: string;
    setAccountFilter: (value: string) => void;
    // Data for filters
    categories: any[];
    accounts: any[];
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}

export function TransactionControlBar({
    searchTerm,
    onSearchChange,
    currentDate,
    onPrevMonth,
    onNextMonth,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    accountFilter,
    setAccountFilter,
    categories,
    accounts,
    onClearFilters,
    hasActiveFilters
}: TransactionControlBarProps) {

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top Row: Month Nav & Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Month Navigator */}
                <div className="flex items-center bg-muted/30 rounded-full p-1 border shadow-sm w-full md:w-auto justify-between md:justify-start">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onPrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold capitalize px-4 min-w-[140px] text-center">
                        {formatMonth(currentDate)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("gap-2", hasActiveFilters && "border-primary text-primary bg-primary/5")}>
                                <Filter className="h-4 w-4" />
                                Filtros
                                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4" align="end">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium leading-none">Filtros Avançados</h4>
                                    {hasActiveFilters && (
                                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={onClearFilters}>
                                            Limpar
                                        </Button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos</SelectItem>
                                            <SelectItem value="receita">Receita</SelectItem>
                                            <SelectItem value="despesa">Despesa</SelectItem>
                                            <SelectItem value="transferencia">Transferência</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Conta</Label>
                                    <Select value={accountFilter} onValueChange={setAccountFilter}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todas</SelectItem>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todas</SelectItem>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button variant="outline" size="icon" disabled title="Exportar (Em breve)">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome, categoria, valor..."
                    className="pl-12 h-12 text-base rounded-xl shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    );
}
