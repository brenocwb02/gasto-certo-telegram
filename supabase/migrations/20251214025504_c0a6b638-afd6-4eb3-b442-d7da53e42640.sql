-- Clear old rate limits to allow users to use the bot again
DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';

-- Also clear specific blocked users
DELETE FROM rate_limits WHERE telegram_id IN (1000505271, 7629270765);