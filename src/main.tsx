import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import App from './App.tsx'
import './index.css'

import { ThemeProvider } from "@/components/theme-provider"

// Initialize Sentry for error tracking
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 0.1, // 10% of transactions
        // Session Replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: import.meta.env.MODE,
    });
}

createRoot(document.getElementById("root")!).render(
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <App />
        </ThemeProvider>
    </Sentry.ErrorBoundary>
);

// Error fallback component
function ErrorFallback() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-md">
                <h1 className="text-2xl font-bold text-destructive">Oops! Algo deu errado</h1>
                <p className="text-muted-foreground">
                    Ocorreu um erro inesperado. Nossa equipe já foi notificada.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Recarregar página
                </button>
            </div>
        </div>
    );
}
