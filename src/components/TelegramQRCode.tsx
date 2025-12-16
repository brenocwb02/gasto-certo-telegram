import { QRCodeSVG } from 'qrcode.react';

interface TelegramQRCodeProps {
    userId: string;
    botUsername?: string;
    size?: number;
}

/**
 * Generates a QR Code for Telegram bot deep linking
 * When scanned, opens Telegram directly to the bot with a start command
 */
export function TelegramQRCode({
    userId,
    botUsername = 'BoasContasBot',
    size = 200
}: TelegramQRCodeProps) {
    // Generate a base64 encoded user ID for the start parameter
    const startCode = btoa(userId).replace(/=/g, '').slice(0, 20);
    const deepLink = `https://t.me/${botUsername}?start=${startCode}`;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG
                    value={deepLink}
                    size={size}
                    level="M"
                    includeMargin={true}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                />
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code para vincular seu Telegram
                </p>
                <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                >
                    Ou clique aqui para abrir no navegador
                </a>
            </div>
        </div>
    );
}

/**
 * Generates the deep link URL for Telegram bot
 */
export function generateTelegramDeepLink(userId: string, botUsername = 'BoasContasBot'): string {
    const startCode = btoa(userId).replace(/=/g, '').slice(0, 20);
    return `https://t.me/${botUsername}?start=${startCode}`;
}
