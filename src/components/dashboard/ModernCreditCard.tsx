
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BankBrand, getBankBrand } from "@/lib/bank-brands";
import { Wifi } from "lucide-react";

interface ModernCreditCardProps {
    account: any;
    brandOverride?: BankBrand;
    className?: string;
    invoiceAmount?: number;
    cardHolderName?: string;
    compact?: boolean;
}

export function ModernCreditCard({
    account,
    brandOverride,
    className,
    invoiceAmount = 0,
    cardHolderName,
    compact = false
}: ModernCreditCardProps) {
    const brand = brandOverride || getBankBrand(account.nome || "", account.banco || "");

    // Extract card holder name from account name
    // Examples: "Cartão Santander Breno" -> "Breno", "Nubank Visa Maria" -> "Maria"
    const extractedHolderName = useMemo(() => {
        if (cardHolderName) return cardHolderName;

        const accountName = account.nome || "";
        // Words to remove (bank names, card types, etc.)
        const wordsToRemove = [
            'cartão', 'cartao', 'crédito', 'credito', 'débito', 'debito',
            'visa', 'mastercard', 'master', 'elo', 'american', 'express', 'amex',
            'nubank', 'inter', 'itau', 'itaú', 'santander', 'bradesco', 'caixa',
            'banco do brasil', 'bb', 'c6', 'xp', 'btg', 'safra', 'sicredi', 'sicoob',
            'original', 'banrisul', 'sofisa', 'pagbank', 'neon', 'next', 'picpay',
            'pan', 'bmg', 'modal', 'stone', 'will', 'rico', 'clear', 'mercado pago'
        ];

        let name = accountName.toLowerCase();
        wordsToRemove.forEach(word => {
            name = name.replace(new RegExp(word, 'gi'), '');
        });

        // Clean up and return
        const cleaned = name.trim().replace(/\s+/g, ' ').split(' ').filter((w: string) => w.length > 1).join(' ');
        return cleaned.length > 0 ? cleaned.toUpperCase() : null;
    }, [account.nome, cardHolderName]);

    // Determine Card Network based on account name or default logic
    const NetworkLogo = useMemo(() => {
        const nameLower = (account.nome || "").toLowerCase();
        if (nameLower.includes("elo")) return EloLogo;
        if (nameLower.includes("visa")) return VisaLogo;
        if (nameLower.includes("master")) return MastercardLogo;

        // Default distribution based on bank brand
        if (['nubank', 'inter', 'c6'].includes(brand.name.toLowerCase())) return MastercardLogo;
        return VisaLogo;
    }, [account.nome, brand.name]);

    // Format last 4 digits
    const last4 = "•••• " + (account.ultimo_quatro_digitos || "8829");

    return (
        <div
            className={cn(
                "relative overflow-hidden text-white shadow-xl transition-all hover:shadow-2xl group w-full mx-auto select-none",
                compact
                    ? "rounded-xl p-3 aspect-[1.586/1] max-w-[280px]" // Standard ratio, limited width (mini)
                    : "rounded-2xl p-5 aspect-[1.586/1] max-w-[360px]",
                brand.gradientClass,
                className
            )}
        >
            {/* Glassmorphism Layers (Enabled for both now, but subtle in compact) */}
            <div className={cn("absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none", compact ? "opacity-10" : "opacity-20")} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-b from-white/10 to-transparent rotate-12 pointer-events-none blur-3xl opacity-50" />
            <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none ring-1 ring-black/5" />


            {/* Content Container */}
            <div className="relative h-full flex flex-col justify-between z-10">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                        {/* Chip - Visible in Compact too (Smaller) */}
                        <div className={cn(
                            "rounded-md bg-gradient-to-br from-[#fdc830] to-[#f37335] overflow-hidden relative border border-[#b45309]/50 shadow-md flex items-center justify-center",
                            compact ? "w-7 h-5" : "w-10 h-7"
                        )}>
                            <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md" />
                            <div className="w-full h-[1px] bg-black/20 absolute top-1/2 -translate-y-1/2" />
                            {!compact && (
                                <>
                                    <div className="h-full w-[1px] bg-black/20 absolute left-1/3" />
                                    <div className="h-full w-[1px] bg-black/20 absolute right-1/3" />
                                </>
                            )}
                        </div>

                        {/* Wifi - Contextual */}
                        <Wifi className={cn("rotate-90 opacity-80 drop-shadow-md", compact ? "h-3 w-3" : "h-5 w-5")} />
                    </div>

                    {/* Bank Logo */}
                    <div className={cn("flex items-center justify-end drop-shadow-lg", compact ? "h-4" : "h-7")}>
                        {brand.iconClass ? (
                            <i className={`${brand.iconClass} ${compact ? 'text-sm' : 'text-2xl'} opacity-95`} />
                        ) : typeof brand.logo === 'string' ? (
                            <img src={brand.logo} alt={brand.name} className="h-full object-contain brightness-0 invert opacity-95" />
                        ) : (
                            <span className={cn("font-bold tracking-wider opacity-90", compact ? "text-[10px]" : "text-base")}>{brand.name}</span>
                        )}
                    </div>
                </div>

                {/* Account Name & Number (The crucial info) */}
                <div className={cn("font-mono tracking-widest opacity-95 drop-shadow-md", compact ? "mt-2 flex flex-col" : "mt-3 text-lg md:text-xl")}>
                    {!compact ? last4 : (
                        <>
                            <span className="text-[10px] uppercase font-sans tracking-normal opacity-90 truncate max-w-[150px] font-semibold leading-tight mb-0.5">
                                {account.nome}
                            </span>
                            <span className="text-[10px] opacity-80">{last4}</span>
                        </>
                    )}
                </div>

                {/* Card Holder Name (Full Mode Only or very mini in compact?) - Skip for compact to save space for important info */}
                {!compact && (
                    <div className="text-xs uppercase tracking-wider opacity-90 mt-2 font-medium drop-shadow-sm">
                        {extractedHolderName || "TITULAR DO CARTÃO"}
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-end mt-auto">
                    <div>
                        <p className={cn("uppercase opacity-80 tracking-widest font-semibold", compact ? "text-[7px] mb-0 leading-none" : "text-[8px] mb-0.5")}>
                            {compact ? "Fatura" : "Fatura Atual"}
                        </p>
                        <p className={cn("font-bold tracking-tight drop-shadow-md", compact ? "text-sm" : "text-xl")}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceAmount)}
                        </p>
                        {/* Expiry Date in Compact */}
                        {compact && account.dia_vencimento && (
                            <p className="text-[8px] opacity-80 mt-0.5 font-medium leading-none">
                                Venc. {account.dia_vencimento}/{new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2}
                            </p>
                        )}
                        {!compact && account.dia_vencimento && (
                            <p className="text-[9px] opacity-80 mt-0.5 font-medium">
                                Vence em {account.dia_vencimento}/{new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2}
                            </p>
                        )}
                    </div>
                    {/* Full Mode Network Logo at Bottom Right - Show Mini Visa in Compact */}
                    <div className={cn("flex items-center drop-shadow-lg", compact ? "h-4" : "h-7 md:h-8")}>
                        <NetworkLogo className="h-full w-auto" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Card Network Logo Components
function MastercardLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" className={className}>
            <circle cx="7" cy="8" r="7" fill="#EB001B" fillOpacity="0.95" />
            <circle cx="17" cy="8" r="7" fill="#F79E1B" fillOpacity="0.95" />
            <path d="M12 13.8A7 7 0 0 1 12 2.2a7 7 0 0 1 0 11.6z" fill="#FF5F00" />
        </svg>
    );
}

function VisaLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 50 18" xmlns="http://www.w3.org/2000/svg" className={className}>
            <text
                x="0"
                y="15"
                fill="white"
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                fontStyle="italic"
                fontSize="18"
            >
                VISA
            </text>
        </svg>
    );
}

function EloLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 18" xmlns="http://www.w3.org/2000/svg" className={className}>
            <text
                x="0"
                y="15"
                fill="#FFCB05"
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
                fontSize="18"
            >
                elo
            </text>
        </svg>
    );
}

