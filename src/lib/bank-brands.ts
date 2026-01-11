

export interface BankBrand {
    name: string;
    primaryColor: string;
    secondaryColor: string; // for contrast text or accent
    gradientClass: string; // Tailwind gradient class
    iconClass?: string; // Icon font class (ibb-*)
    logo?: string; // URL fallback
    keywords: string[]; // for matching
}

// Brand Logos (Simple SVGs) - URL fallback
const NuLogo = "https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg";
const InterLogo = "https://upload.wikimedia.org/wikipedia/commons/e/e9/Banco_Inter_logo.svg";
const ItauLogo = "https://upload.wikimedia.org/wikipedia/commons/2/2e/Ita%C3%BA.svg";
const SantanderLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Santander_Logo.svg/2560px-Santander_Logo.svg.png";
const BradescoLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Banco_Bradesco_logo.svg/1024px-Banco_Bradesco_logo.svg.png";
const BBLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Banco_do_Brasil_logo.svg/1024px-Banco_do_Brasil_logo.svg.png";
const CaixaLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Caixa_Econ%C3%B4mica_Federal_logo.svg/1024px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png";
const C6Logo = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/C6_Bank_logo.svg/1024px-C6_Bank_logo.svg.png";
const XPLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/XP_Investimentos_logo.svg/1200px-XP_Investimentos_logo.svg.png";
const MPLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Mercado_Pago_Logo.png/1200px-Mercado_Pago_Logo.png";

export const banks: BankBrand[] = [
    {
        name: "Nubank",
        primaryColor: "#820AD1",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#820AD1] to-[#400080]",
        iconClass: "ibb-nubank",
        logo: NuLogo,
        keywords: ["nubank", "nu", "roxinho"]
    },
    {
        name: "Inter",
        primaryColor: "#FF7A00",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#FF7A00] to-[#E05900]",
        iconClass: "ibb-inter",
        logo: InterLogo,
        keywords: ["inter", "banco inter"]
    },
    {
        name: "Itaú",
        primaryColor: "#EC7000",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#EC7000] to-[#B35200]",
        iconClass: "ibb-itau",
        logo: ItauLogo,
        keywords: ["itaú", "itau"]
    },
    {
        name: "Santander",
        primaryColor: "#EC0000",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#EC0000] to-[#990000]",
        iconClass: "ibb-santander",
        logo: SantanderLogo,
        keywords: ["santander", "sx"]
    },
    {
        name: "Bradesco",
        primaryColor: "#CC092F",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#CC092F] to-[#99001D]",
        iconClass: "ibb-bradesco",
        logo: BradescoLogo,
        keywords: ["bradesco"]
    },
    {
        name: "Banco do Brasil",
        primaryColor: "#0038A8",
        secondaryColor: "#F8D117",
        gradientClass: "bg-gradient-to-br from-[#0038A8] to-[#002266]",
        iconClass: "ibb-banco-brasil",
        logo: BBLogo,
        keywords: ["banco do brasil", "bb"]
    },
    {
        name: "Caixa",
        primaryColor: "#005CA9",
        secondaryColor: "#F2811D",
        gradientClass: "bg-gradient-to-br from-[#005CA9] to-[#003C70]",
        iconClass: "ibb-caixa",
        logo: CaixaLogo,
        keywords: ["caixa", "cef"]
    },
    {
        name: "C6 Bank",
        primaryColor: "#242424",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#242424] to-[#000000]",
        logo: C6Logo,
        keywords: ["c6", "c6 bank", "carbon"]
    },
    {
        name: "BTG Pactual",
        primaryColor: "#00355F",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00355F] to-[#001D36]",
        keywords: ["btg", "btg pactual"]
    },
    {
        name: "XP Investimentos",
        primaryColor: "#000000",
        secondaryColor: "#D6A33E",
        gradientClass: "bg-gradient-to-br from-[#000000] to-[#333333]",
        logo: XPLogo,
        keywords: ["xp", "xp investimentos"]
    },
    {
        name: "Mercado Pago",
        primaryColor: "#009EE3",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#009EE3] to-[#0070A3]",
        logo: MPLogo,
        keywords: ["mercado pago", "mp", "mercado livre"]
    },
    {
        name: "Sicredi",
        primaryColor: "#00653A",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00653A] to-[#004426]",
        iconClass: "ibb-sicredi",
        keywords: ["sicredi"]
    },
    {
        name: "Sicoob",
        primaryColor: "#003641",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#003641] to-[#00222A]",
        iconClass: "ibb-sicoob",
        keywords: ["sicoob"]
    },
    {
        name: "Safra",
        primaryColor: "#004B87",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#004B87] to-[#003356]",
        iconClass: "ibb-safra",
        keywords: ["safra"]
    },
    {
        name: "Original",
        primaryColor: "#00A651",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00A651] to-[#007538]",
        iconClass: "ibb-original",
        keywords: ["original", "banco original"]
    },
    {
        name: "Banrisul",
        primaryColor: "#003399",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#003399] to-[#002266]",
        iconClass: "ibb-banrisul",
        keywords: ["banrisul"]
    },
    // Digital Banks & Fintechs
    {
        name: "Sofisa Direto",
        primaryColor: "#00A859",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00A859] to-[#007A3D]",
        keywords: ["sofisa", "sofisa direto"]
    },
    {
        name: "PagBank",
        primaryColor: "#00A859",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00A859] to-[#006B3D]",
        keywords: ["pagbank", "pagseguro"]
    },
    {
        name: "Neon",
        primaryColor: "#0094FF",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#0094FF] to-[#0064CC]",
        keywords: ["neon"]
    },
    {
        name: "Next",
        primaryColor: "#00CF6B",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00CF6B] to-[#009B4F]",
        keywords: ["next"]
    },
    {
        name: "PicPay",
        primaryColor: "#21C25E",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#21C25E] to-[#168A42]",
        keywords: ["picpay"]
    },
    {
        name: "Agibank",
        primaryColor: "#FF6600",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#FF6600] to-[#CC5200]",
        keywords: ["agibank"]
    },
    {
        name: "Banco Pan",
        primaryColor: "#0066CC",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#0066CC] to-[#004C99]",
        keywords: ["pan", "banco pan"]
    },
    {
        name: "BMG",
        primaryColor: "#E31937",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#E31937] to-[#B31329]",
        keywords: ["bmg"]
    },
    {
        name: "Daycoval",
        primaryColor: "#003087",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#003087] to-[#002266]",
        keywords: ["daycoval"]
    },
    {
        name: "Modal",
        primaryColor: "#1E1E1E",
        secondaryColor: "#F5A623",
        gradientClass: "bg-gradient-to-br from-[#1E1E1E] to-[#000000]",
        keywords: ["modal", "banco modal", "modalmais"]
    },
    {
        name: "Stone",
        primaryColor: "#00A868",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00A868] to-[#007A4D]",
        keywords: ["stone", "conta stone"]
    },
    {
        name: "Will Bank",
        primaryColor: "#7B61FF",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#7B61FF] to-[#5A45CC]",
        keywords: ["will", "will bank", "willbank"]
    },
    {
        name: "Rico",
        primaryColor: "#FF5000",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#FF5000] to-[#CC4000]",
        keywords: ["rico"]
    },
    {
        name: "Clear",
        primaryColor: "#00B0F0",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#00B0F0] to-[#0088CC]",
        keywords: ["clear"]
    },
    {
        name: "Binance",
        primaryColor: "#F0B90B",
        secondaryColor: "#000000",
        gradientClass: "bg-gradient-to-br from-[#F0B90B] to-[#C99A00]",
        keywords: ["binance"]
    },
    {
        name: "Foxbit",
        primaryColor: "#FF6B00",
        secondaryColor: "#FFFFFF",
        gradientClass: "bg-gradient-to-br from-[#FF6B00] to-[#CC5500]",
        keywords: ["foxbit"]
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
        gradientClass: "bg-gradient-to-br from-slate-600 to-slate-800",
        keywords: []
    };
};


