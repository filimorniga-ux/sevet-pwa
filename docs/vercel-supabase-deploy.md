# Deploy automatico en Vercel + secretos

Este proyecto ya esta enlazado a Vercel (`.vercel/project.json` existe), por lo que el flujo recomendado es:

1. `git push` a `main`
2. Vercel detecta el push y despliega automaticamente

No necesitas workflow de GitHub Pages para esto.

## Variables en Vercel (Project Settings > Environment Variables)

Crear estas variables en `Production`, `Preview` y `Development`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CHAT_AI_URL`

Valores sugeridos:

- `VITE_SUPABASE_URL=https://zyvwcxsqdbegzjlmgtou.supabase.co`
- `VITE_CHAT_AI_URL=https://zyvwcxsqdbegzjlmgtou.supabase.co/functions/v1/chat-ai`
- `VITE_SUPABASE_ANON_KEY=<anon key de Supabase>`

## Secreto en Supabase (Edge Function chat-ai)

El secreto de OpenAI no va en Vercel para esa funcion, va en Supabase:

```bash
supabase secrets set OPENAI_API_KEY=sk-... --project-ref zyvwcxsqdbegzjlmgtou
```

Luego vuelve a desplegar la funcion `chat-ai` si corresponde.

## GitHub Actions recomendadas (sin deploy)

Se mantienen:

- `CI` (build/lint/test si existen)
- `CodeQL`
- `Dependabot`

No se usa `Deploy to GitHub Pages` para evitar doble despliegue.
