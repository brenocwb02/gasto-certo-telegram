CREATE TABLE public.scheduled_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'falhou')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem gerenciar suas próprias notificações"
ON public.scheduled_notifications
FOR ALL
USING (auth.uid() = user_id);

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER update_scheduled_notifications_updated_at
BEFORE UPDATE ON public.scheduled_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_scheduled_notifications_status ON public.scheduled_notifications(status);
