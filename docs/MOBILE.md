# Mente Nova no telemóvel

O app é uma **PWA** (Progressive Web App): abre no browser e pode ser **instalado no ecrã inicial** como uma app.

## Opção 1 — Testar na mesma rede Wi‑Fi (desenvolvimento)

1. No PC, na pasta do projeto:
   ```bash
   npm run dev
   ```
2. Descobre o IP do PC (Windows: `ipconfig` → IPv4, ex. `192.168.1.10`).
3. No telemóvel (mesma Wi‑Fi), abre o browser em:
   ```
   http://SEU_IP:3000
   ```
4. O `.env.local` fica no PC; o telemóvel usa o Vite do PC — Supabase e Gemini funcionam se o PC tiver internet.

**Firewall:** se não abrir, permite a porta **3000** no Windows Defender.

## Opção 2 — Instalar no telemóvel (PWA)

Depois de publicar o site (opção 3) ou com `npm run build` + `npm run preview:mobile`:

### Android (Chrome)

1. Abre o site.
2. Menu (⋮) → **Instalar app** ou **Adicionar ao ecrã inicial**.

### iPhone (Safari)

1. Abre o site no **Safari** (não no Chrome).
2. Partilhar → **Adicionar à página inicial**.
3. Confirma o nome **Mente Nova**.

O app abre em ecrã completo, sem barra do browser.

## Opção 3 — Publicar na internet (recomendado para uso diário)

### Vercel (grátis)

1. Conta em [vercel.com](https://vercel.com).
2. Importa o repositório Git do projeto.
3. Em **Environment Variables**, adiciona as mesmas do `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY` (se usar IA no diário)
   - Variáveis de áudio (`VITE_AUDIO_*`), se existirem.
4. Deploy → abre o URL no telemóvel e instala como PWA (opção 2).

### Netlify

Igual: build `npm run build`, publish folder `dist`, variáveis `VITE_*` no painel.

## Variáveis de ambiente no telemóvel

As chaves `VITE_*` são incluídas no **build**. Para produção:

- Faz deploy com as variáveis configuradas no hosting.
- Não partilhes o repositório com `.env.local` público.

## Supabase no telemóvel

- Usa o **mesmo projeto** Supabase; sync do diário funciona em qualquer dispositivo com o mesmo browser/profile (por `device_id` no localStorage de cada telemóvel).
- Para sincronizar entre telemóvel e PC com a mesma conta no futuro, será preciso login Supabase (ainda não implementado).

## Comandos úteis

| Comando | Uso |
|---------|-----|
| `npm run dev` | PC + telemóvel na rede local |
| `npm run build` | Gera `dist/` para deploy |
| `npm run preview:mobile` | Testa build na rede local (porta 4173) |
