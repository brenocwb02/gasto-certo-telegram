import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export default function Styleguide() {
    return (
        <div className="min-h-screen bg-background p-8 space-y-12">

            {/* HEADER */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Boas Contas Design System</h1>
                <p className="text-xl text-muted-foreground">Fundamentos visuais, tokens e componentes do sistema financeiro.</p>
            </div>

            <hr className="border-border" />

            {/* 0. BRAND IDENTITY */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">0. Identidade da Marca (Logo Colors)</h2>
                <p className="text-muted-foreground">Cores extraídas da logomarca oficial do Boas Contas.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-brand-navy" />
                                Brand Navy
                            </CardTitle>
                            <CardDescription>Cor principal (Background do 'B'). Base para Primary.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 w-full rounded-lg bg-brand-navy flex items-center justify-center text-white font-medium">
                                bg-brand-navy
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-brand-green" />
                                Brand Green
                            </CardTitle>
                            <CardDescription>Cor de destaque (Checkmark). Base para Success/Accent.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 w-full rounded-lg bg-brand-green flex items-center justify-center text-white font-medium">
                                bg-brand-green
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* 1. COLORS */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">1. Identidade Financeira (Cores Semânticas)</h2>
                <p className="text-muted-foreground">Tokens globais para garantir consistência em dashboards e relatórios.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* INCOME */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-income" />
                                Receita (Income)
                            </CardTitle>
                            <CardDescription>Token: --income / .text-income</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 w-full rounded-lg bg-income flex items-center justify-center text-white font-medium">
                                bg-income
                            </div>
                        </CardContent>
                    </Card>

                    {/* EXPENSE */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-expense" />
                                Despesa (Expense)
                            </CardTitle>
                            <CardDescription>Token: --expense / .text-expense</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 w-full rounded-lg bg-expense flex items-center justify-center text-white font-medium">
                                bg-expense
                            </div>
                        </CardContent>
                    </Card>

                    {/* BALANCE */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-balance" />
                                Saldo (Balance)
                            </CardTitle>
                            <CardDescription>Token: --balance / .text-balance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-20 w-full rounded-lg bg-balance flex items-center justify-center text-white font-medium">
                                bg-balance
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-primary rounded-md" />
                        <p className="text-xs font-medium">Primary</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-secondary rounded-md" />
                        <p className="text-xs font-medium">Secondary</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-muted rounded-md" />
                        <p className="text-xs font-medium">Muted</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-accent rounded-md" />
                        <p className="text-xs font-medium">Accent</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-destructive rounded-md" />
                        <p className="text-xs font-medium">Destructive</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-12 w-full bg-background border rounded-md" />
                        <p className="text-xs font-medium">Background</p>
                    </div>
                </div>
            </section>

            {/* 2. TYPOGRAPHY */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">2. Tipografia</h2>

                <Card className="p-8 space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 1</p>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Saldo Atual: R$ 10.000,00</h1>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 2</p>
                        <h2 className="text-3xl font-semibold tracking-tight">Transações Recentes</h2>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 3</p>
                        <h3 className="text-2xl font-semibold tracking-tight">Minhas Contas</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Heading 4</p>
                        <h4 className="text-xl font-semibold tracking-tight">Cartão de Crédito</h4>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Body/P</p>
                        <p className="leading-7">
                            O sistema Boas Contas permite um controle financeiro rigoroso. Utilize a regra 50/30/20 para organizar seu orçamento.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Small/Muted</p>
                        <p className="text-sm text-muted-foreground">
                            Última atualização: Hoje às 14:00
                        </p>
                    </div>
                </Card>
            </section>

            {/* 3. COMPONENTS */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">3. Componentes Base</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* BUTONS */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Botões</h3>
                        <div className="flex flex-wrap gap-4">
                            <Button>Default</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="link">Link</Button>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Button className="bg-income hover:bg-income/90 text-white">Income Action</Button>
                            <Button className="bg-expense hover:bg-expense/90 text-white">Expense Action</Button>
                        </div>
                    </div>

                    {/* BADGES */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Badges e Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="destructive">Destructive</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-income/10 text-income hover:bg-income/20 shadow-none border-none">Receita</Badge>
                            <Badge className="bg-expense/10 text-expense hover:bg-expense/20 shadow-none border-none">Despesa</Badge>
                            <Badge className="bg-balance/10 text-balance hover:bg-balance/20 shadow-none border-none">Pago</Badge>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
                        </div>
                    </div>

                    {/* CARDS */}
                    <div className="space-y-4 col-span-1 md:col-span-2">
                        <h3 className="text-lg font-medium">Cards & Inputs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Card Padrão</CardTitle>
                                    <CardDescription>Usado para agrupar conteúdo.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" placeholder="exemplo@boascontas.com" />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <Button>Salvar</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Example Transaction Item */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Item de Lista "Clean"</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer border-b md:border-b-0">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-income/10 text-income">
                                                <Wallet className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Salário Mensal</p>
                                                <p className="text-xs text-muted-foreground">Itau • Hoje</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-income">+R$ 5.000,00</p>
                                            <Badge variant="secondary" className="text-[10px] h-5">Renda</Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-expense/10 text-expense">
                                                <TrendingDown className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Supermercado</p>
                                                <p className="text-xs text-muted-foreground">Nubank • Ontem</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-expense">-R$ 450,00</p>
                                            <Badge variant="secondary" className="text-[10px] h-5">Alimentação</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
