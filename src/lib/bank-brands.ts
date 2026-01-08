
export interface BankBrand {
    name: string;
    primaryColor: string;
    secondaryColor: string; // for contrast text or accent
    keywords: string[]; // for matching
}

const banks: BankBrand[] = [
    {
        name: "Nubank",
        primaryColor: "#820AD1",
        secondaryColor: "#FFFFFF",
        keywords: ["nubank", "nu", "roxinho"]
    },
    {
        name: "Inter",
        primaryColor: "#FF7A00",
        secondaryColor: "#FFFFFF",
        keywords: ["inter", "banco inter"]
    },
    {
        name: "Itaú",
        primaryColor: "#EC7000",
        secondaryColor: "#FFFFFF",
        keywords: ["itaú", "itau"]
    },
    {
        name: "Santander",
        primaryColor: "#EC0000",
        secondaryColor: "#FFFFFF",
        keywords: ["santander", "sx"]
    },
    {
        name: "Bradesco",
        primaryColor: "#CC092F",
        secondaryColor: "#FFFFFF",
        keywords: ["bradesco"]
    },
    {
        name: "Banco do Brasil",
        primaryColor: "#0038A8",
        secondaryColor: "#F8D117",
        keywords: ["banco do brasil", "bb"]
    },
    {
        name: "Caixa",
        primaryColor: "#005CA9",
        secondaryColor: "#F2811D",
        keywords: ["caixa", "cef"]
    },
    {
        name: "C6 Bank",
        primaryColor: "#242424",
        secondaryColor: "#FFFFFF",
        keywords: ["c6", "c6 bank", "carbon"]
    },
    {
        name: "BTG Pactual",
        primaryColor: "#00355F",
        secondaryColor: "#FFFFFF",
        keywords: ["btg", "btg pactual"]
    },
    {
        name: "XP Investimentos",
        primaryColor: "#000000",
        secondaryColor: "#D6A33E",
        keywords: ["xp", "xp investimentos"]
    },
    {
        name: "Mercado Pago",
        primaryColor: "#009EE3",
        secondaryColor: "#FFFFFF",
        keywords: ["mercado pago", "mp", "mercado livre"]
    }
];

export const getBankBrand = (accountName: string, bankName?: string): BankBrand => {
    const normalize = (s: string) => s.toLowerCase().trim();
    const searchStr = normalize(bankName || accountName || "");

    // Try exact match first on keywords
    const found = banks.find(b => b.keywords.some(k => searchStr.includes(k)));

    if (found) return found;

    // Default fallback
    return {
        name: "Banco",
        primaryColor: "#64748b", // slate-500
        secondaryColor: "#FFFFFF",
        keywords: []
    };
};
