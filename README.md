# MacroView Pro

Painel de Leitura Macroeconômica Automatizada para Day Traders

## Visão Geral

MacroView Pro é um dashboard institucional em tempo real projetado para day traders brasileiros focados em WDO (Dólar Futuro) e WIN (Mini Índice). O sistema monitora continuamente indicadores macroeconômicos globais e fornece interpretações automatizadas de cenários de mercado para auxiliar na tomada de decisão de trading.

O projeto foi desenvolvido seguindo a metodologia do trader Diego Bessil, integrando análise de fluxos globais, cenários de risco e correlações intermercado em uma interface unificada.

## Funcionalidades

- **Dashboard em Tempo Real**: Métricas de mercado atualizadas continuamente com cache inteligente
- **Cenários Automáticos**: Interpretação automática (Risk-On, Risk-Off, Neutro) baseada em indicadores
- **Análise com IA (Gemini)**: Análise dinâmica de mercado via Google Gemini 2.5 com contexto de notícias
- **Agenda Econômica**: Monitoramento de eventos de alto impacto com volatilidade prevista
- **Matriz de Correlações**: Análise visual das correlações entre ativos e seus impactos no WDO/WIN
- **Verificação de Feriados B3**: Verificação automática de feriados da B3 (Bolsa de Valores Brasileira)
- **Auto-Refresh Inteligente**: Pausa automática quando a aba do navegador está oculta para economizar recursos

## Stack Tecnológica

- **Framework**: Nuxt 3 com Vue 3 Composition API
- **Linguagem**: TypeScript em modo estrito
- **Estilização**: Tailwind CSS
- **State Management**: Pinia
- **Server Routes**: H3 (Nitro)
- **IA**: Google Gemini 2.5
- **Gráficos**: Lightweight Charts

## Fontes de Dados

O sistema integra múltiplas fontes de dados para fornecer uma visão completa do mercado:

| Fonte | Dados Fornecidos | Status |
|-------|-----------------|--------|
| **Yahoo Finance** | VIX, DXY, Ouro (XAU/USD), Brent, EWZ, VALE, S&P 500, Nasdaq, Treasuries | Gratuito |
| **AwesomeAPI** | USD/BRL, EUR/BRL, MXN/BRL | Gratuito |
| **Twelve Data** | Reservado para futuras expansões | Opcional |
| **FRED (Federal Reserve)** | Iron Ore via VALE (proxy) | Gratuito |

## Quick Start

```bash
# Clone o repositório
git clone <repository-url>
cd macroview-pro

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Verificação de tipos
npm run typecheck

# Build para produção
npm run build

# Preview do build de produção
npm run preview
```

O servidor de desenvolvimento estará disponível em `http://localhost:3000`.

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# APIs Opcionais
TWELVE_DATA_API_KEY=your_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Configurações Públicas
NUXT_PUBLIC_APP_NAME=MacroView Pro
NUXT_PUBLIC_APP_VERSION=1.0.0
```

### API Keys Necessárias

O sistema funciona com APIs gratuitas para a maioria dos dados. Algumas funcionalidades requerem chaves:

| API | Status | Requer Key | Endpoint | Uso Principal |
|-----|--------|------------|----------|---------------|
| **AwesomeAPI** | Gratuita | Não | `economia.awesomeapi.com.br` | USD/BRL, EUR/BRL, MXN/BRL |
| **Yahoo Finance** | Gratuita | Não | `query1.finance.yahoo.com` | VIX, DXY, EWZ, Treasuries, Commodities |
| **Gemini AI** | Opcional | Sim | Google AI Studio | Análise de mercado com IA |
| **Twelve Data** | Opcional | Sim | `twelvedata.com` | XAU/USD mais preciso |

### Configurando API Keys Opcionais

#### Gemini AI (Opcional - Análise de IA)
1. Acesse https://aistudio.google.com/app/apikey
2. Registre-se e gere uma API key gratuita
3. Adicione ao `.env`:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```
4. Sem a chave, o sistema usa análisefallback local

#### Twelve Data (Opcional)
1. Acesse https://twelvedata.com/pricing
2. Registre-se para o plano gratuito (8 requests/minuto)
3. Adicione ao `.env`:
   ```
   TWELVE_DATA_API_KEY=sua_chave_aqui
   ```

## Arquitetura

### Visão Geral da Arquitetura

O MacroView Pro utiliza uma arquitetura híbrida Nuxt 3 com server routes para proxy de APIs e cache inteligente no servidor.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Navegador (Client)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Pages     │  │ Components  │  │   Stores    │             │
│  │  dashboard  │  │   Market    │  │   Market    │             │
│  │   agenda    │  │ Correlation │  │             │             │
│  │correlacoes  │  │  Calendar   │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Nuxt Server (SSR)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Server Routes (API)                       ││
│  │  market-overview │ currencies │ risk-indicators │ analysis  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Cache Layer (Memory)                      ││
│  │           60s para dados de mercado, 5min para análise       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
     ┌──────────┐       ┌──────────┐       ┌──────────┐
     │AwesomeAPI│       │Yahoo     │       │ Twelve   │
     │          │       │Finance   │       │ Data     │
     └──────────┘       └──────────┘       └──────────┘
```

### Rotas de API (Server Routes)

| Endpoint | Descrição | Fonte | Cache |
|----------|-----------|-------|-------|
| `/api/market-overview` | Dados consolidados de todos os mercados | Múltiplas | 60s |
| `/api/currencies` | USD/BRL, EUR/BRL, MXN/BRL | AwesomeAPI | 60s |
| `/api/risk-indicators` | VIX, DXY, ETF BR (EWZ) | Yahoo Finance | 60s |
| `/api/commodities` | Brent, Ouro, Minério de Ferro (VALE) | Yahoo Finance | 60s |
| `/api/brazil-flow` | ETF EWZ (fluxo estrangeiro Brasil) | Yahoo Finance | 60s |
| `/api/treasuries` | Treasury 10yr (TNX), 5yr | Yahoo Finance | 60s |
| `/api/events` | Agenda econômica com impacto | Events Utils | 5min |
| `/api/correlations` | Matriz de correlações | Computado | 1h |
| `/api/analysis` | Análise de mercado via Gemini | IA | 5min |
| `/api/news/latest` | Últimas notícias de mercado | News API | 15min |

### Estrutura de Pastas

```
macroview-pro/
├── assets/
│   └── css/
│       └── main.css                 # Estilos globais Tailwind
├── components/
│   ├── calendar/
│   │   ├── CalendarFilters.vue      # Filtros de categoria de eventos
│   │   ├── EventCard.vue            # Card individual de evento
│   │   └── VolatilityWatch.vue      # Monitor de volatilidade
│   ├── charts/
│   │   └── SparklineChart.vue       # Gráfico sparkline reutilizável
│   ├── correlation/
│   │   ├── CorrelationCard.vue      # Card de ativo correlacionado
│   │   ├── CorrelationChart.vue     # Gráfico de linha temporal
│   │   ├── InsightCard.vue          # Card de insight de correlação
│   │   ├── MatrixTable.vue          # Tabela matriz de correlações
│   │   └── ScenarioDetailCard.vue   # Detalhes do cenário atual
│   ├── market/
│   │   ├── MarketCard.vue           # Card de métrica de mercado
│   │   ├── MetricGrid.vue           # Grade de métricas
│   │   └── ScenarioCard.vue         # Card de cenário (Risk-On/Off)
│   └── ui/
│       └── TimeDisplay.vue          # Componente de exibição de hora UTC
├── composables/
│   ├── useAutoRefresh.ts            # Auto-refresh com Page Visibility API
│   ├── useMacroAnalysis.ts          # Análise macroeconômica
│   └── useMarketData.ts             # Fetch de dados de mercado
├── layouts/
│   └── default.vue                  # Layout padrão com sidebar
├── pages/
│   ├── agenda.vue                   # Página da agenda econômica
│   ├── correlacoes.vue              # Página da matriz de correlações
│   ├── dashboard.vue                # Página principal do dashboard
│   └── index.vue                    # Redirecionamento para dashboard
├── server/
│   ├── api/
│   │   ├── analysis.get.ts          # API de análise Gemini
│   │   ├── brazil-flow.get.ts       # API de fluxo Brasil (EWZ)
│   │   ├── commodities.get.ts       # API de commodities
│   │   ├── correlations.get.ts      # API de correlações
│   │   ├── currencies.get.ts        # API de câmbio
│   │   ├── events.get.ts            # API de eventos econômicos
│   │   ├── market-overview.get.ts   # API consolidada
│   │   ├── news/
│   │   │   ├── combined.get.ts      # API de notícias combinadas
│   │   │   └── latest.get.ts        # API de últimas notícias
│   │   ├── risk-indicators.get.ts   # API de indicadores de risco
│   │   └── treasuries.get.ts        # API de treasuries
│   ├── types/
│   │   └── market.ts                # Tipos TypeScript para market
│   └── utils/
│       ├── cache.ts                 # Utilitário de cache em memória
│       ├── events.ts                # Utilitário de eventos econômicos
│       ├── gemini.ts                # Serviço de análise Gemini AI
│       ├── yahooFetcher.ts          # Fetch com retry para Yahoo
│       └── markdown.ts              # Utilitário de parsing Markdown
├── stores/
│   └── market.ts                    # Store Pinia para dados de mercado
├── types/
│   ├── calendar.ts                  # Tipos para calendário
│   ├── correlation.ts               # Tipos para correlações
│   ├── market.ts                    # Tipos gerais de mercado
│   └── news.ts                      # Tipos para notícias
├── nuxt.config.ts                   # Configuração Nuxt
├── tailwind.config.ts               # Configuração Tailwind
├── package.json                     # Dependências npm
└── tsconfig.json                    # Configuração TypeScript
```

## Indicadores de Mercado e Limiares

### Análise de Risco de Mercado

O sistema determina automaticamente o cenário atual baseado na análise combinada de múltiplos indicadores:

#### Limiar de Medo (VIX)

| Condição | Cenário | Interpretação |
|----------|---------|---------------|
| VIX > 15 | Risk-Off (Medo) | Aversão ao risco elevada, mercado volatility |
| VIX < 15 + queda > 7% | Risk-On | Mercado tranquilo, busca por risco |
| VIX entre 15-20 | Neutro | Sem direção clara |

#### Indicadores Secundários

- **DXY (Índice Dólar)**: DXY subindo = dólar forte = negativo para WIN
- **DXY caindo**: Dólar fraco = favorável para emergentes e WIN

### Correlações Macro

| Par de Ativos | Correlação | Sinal de Confirmação |
|---------------|------------|---------------------|
| Ouro subindo + DXY caindo | Risco-On Confirmado | Forte |
| Ouro subindo + DXY subindo | Risco-Off Genuíno | Forte |
| MXN subindo | Fluxo para emergentes | Positivo |
| EWZ subindo | Fluxo estrangeiro no Brasil | Positivo |

### Commodities e Proxies

| Ativo | Proxy | Uso Principal |
|-------|-------|---------------|
| Brent > 80 | PETR4 | Petrobras em alta |
| VALE3.SA | Minério de Ferro | Setor de commodities |
| EWZ | Brasil | Fluxo estrangeiro |
| S&P 500 / Nasdaq | fallback | Mercado americano |

## Metodologia de Análise

### Cenários de Mercado

O sistema determina automaticamente o cenário atual baseado na análise combinada de múltiplos indicadores. Existem três cenários principais:

#### Risk-On (Compra de Risco)

**Condições para Risk-On:**
- VIX < 15 (mercado tranquilo, baixa aversão ao risco)
- DXY em tendência de queda (dólar fraco globalmente)
- EWZ subindo (fluxo estrangeiro entrando no Brasil)

**Interpretação para Trading:**
Traders buscam retorno em mercados emergentes. Nesse cenário:
- **WIN tende a subir** (pressão compradora)
- **WDO tende a cair** (dólar mais fraco)

**Sinais de Confirmação Risk-On:**
- Ouro subindo + DXY caindo = confirmação forte
- MXN subindo (moedas emergentes)
- Commodities em alta (Brent, Minério)

#### Risk-Off (Fuga para Qualidade)

**Condições para Risk-Off:**
- VIX > 15 (medo elevado, volatilidade alta)
- DXY em tendência de alta (dólar fortalecendo globalmente)
- Ouro subindo (busca por segurança, fluxo para haven)

**Interpretação para Trading:**
Capital foge para ativos seguros e refúgio. Nesse cenário:
- **WIN tende a cair** (pressão vendedora)
- **WDO tende a subir** (dólar mais forte)

**Sinais de Confirmação Risk-Off:**
- Ouro subindo + DXY subindo = Risk-Off genuíno
- VIX > 25 indica volatilidade extrema
- Treasuries subindo (flight to safety)
- EWZ em queda (fluxo saindo do Brasil)

#### Neutro

**Interpretação:**
Mercado sem direção clara, misto ou em transição. Nesse cenário:
- Aguardar confirmação de tendência
- Evitar posições direcionais grandes
- Melhor operar com spreads ou esperar setups claros

**Características do Cenário Neutro:**
- VIX entre 15-20
- DXY lateralizado
- EWZ sem direção definida

### Tabela de Correlações

| Ativo | Correlação | Impacto no WIN | Impacto no WDO |
|-------|------------|----------------|----------------|
| **Ouro (XAU/USD)** | Inversão com DXY | Negativo quando DXY sobe | Positivo quando DXY sobe |
| **VIX < 15** | Risk-On | Positivo | Negativo |
| **VIX > 15** | Risk-Off | Negativo | Positivo |
| **EWZ ETF** | Fluxo Brasil | Positivo | Negativo |
| **Brent > 80** | Commodity/Brasil | Positivo | Negativo |
| **TNX subindo** | Juros US em alta | Negativo | Positivo |
| **DXY subindo** | Dólar fraco | Positivo | Negativo |

### Indicadores Principais e Seus Significados

| Indicador | Descrição | Range Normal | Interpretação |
|-----------|-----------|--------------|---------------|
| **VIX** | Índice de Volatilidade CBOE | 10-30 | <15=calm, >15=risk-off |
| **DXY** | Índice Dólar Americano | 95-110 | >102=strong dollar |
| **EWZ** | ETF Brasil | 30-50 | >high=flow in |
| **TNX** | Treasury 10yr Yield | 3-5% | >4.5%=high rates |
| **Ouro** | XAU/USD | 1900-2100 | >2000=risk-off |
| **VALE** | Minério de Ferro Proxy | Variável | Iron Ore Brazil |

## Layout do Dashboard

### Barra Lateral (Sidebar)

A navegação lateral contém:

- **Dashboard** - Página principal com métricas e cenários
- **Agenda Econômica** - Calendário de eventos macroeconômicos
- **Matriz de Correlações** - Visualização interativa de correlações
- **Configurações** - (futuro) Configurações de API e preferências

### Painel Principal do Dashboard

O dashboard principal exibe:

1. **Header**: Logo MacroView Pro + Horário UTC em tempo real
2. **Status de Mercado**: Verificação automática de feriados B3
3. **Cards de Cenário**: Identificação automática do cenário atual (Risk-On/Risk-Off/Neutro) com justificativa
4. **Análise de IA**: Comentário gerado pelo Gemini com sinais dinâmicos
5. **Grid de Métricas**: 
   - USD/BRL (Dólar Comercial)
   - EUR/BRL (Euro)
   - MXN/BRL (Peso Mexicano)
   - VIX (Volatilidade)
   - DXY (Índice Dólar)
   - EWZ (ETF Brasil)
   - Ouro (XAU/USD)
   - Brent (Petroleum)
   - VALE (Minério de Ferro)
   - TNX (Treasury 10yr)
6. **Interpretação**: Texto explicativo do cenário do dia

### Responsividade

O layout é totalmente responsivo:

| Breakpoint | Colunas do Grid | Dispositivo |
|------------|------------------|--------------|
| `sm` (< 640px) | 1 coluna | Mobile |
| `md` (640-768px) | 2 colunas | Tablet |
| `lg` (768-1024px) | 2-3 colunas | Tablet landscape |
| `xl` (≥ 1024px) | 4 colunas | Desktop |

### Rodapé

O rodapé contém:
- **Ticker de Cotações**: Cotações em tempo real dos principais ativos
- **Horário**: Relógio sincronizado com UTC

## Performance

### Estratégias de Performance

1. **Cache de API no Servidor**
   - Dados de mercado: cache de 60 segundos
   - Análise de IA (Gemini): cache de 5 minutos
   - Eventos econômicos: cache de 5 minutos
   - Correlações: cache de 1 hora
   - Evita rate limits e reduz latência

2. **Auto-Refresh Inteligente**
   - Utiliza Page Visibility API
   - Pausa requisições quando aba está oculta
   - Retoma automaticamente quando usuário retorna
   - Economia de recursos e API calls

3. **Otimizações de Renderização**
   - Lazy loading de componentes com `defineAsyncComponent`
   - Skeleton loading states durante carregamento
   - Componentes com `shallowRef` para evitar re-renderizações desnecessárias

4. **Bundle Optimization**
   - Tree-shaking automático via Nuxt
   - CSS purgado via Tailwind
   - Fontes otimizadas

### Monitoramento de Performance

O dashboard exibe:
- Timestamp da última atualização
- Indicador visual de "ao vivo" / "desatualizado"
- Skeleton loaders durante estados de loading

## Deploy

### Deploy para Vercel (Recomendado)

1. Faça push do código para GitHub
2. Conecte o repositório em https://vercel.com
3. Configure as variáveis de ambiente na Vercel:
   - `TWELVE_DATA_API_KEY`
   - `GEMINI_API_KEY`
   - `NUXT_PUBLIC_APP_NAME`
4. Deploy automático a cada push na main

```bash
# Instale Vercel CLI (opcional)
npm i -g vercel

# Deploy manual
vercel
```

### Deploy para Railway

1. Conecte seu repositório GitHub em https://railway.app
2. Adicione as variáveis de ambiente
3. Railway detectará Nuxt automaticamente

### Deploy Manual (VPS/Docker)

```dockerfile
# Dockerfile.example
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

```bash
# Build
npm run build

# Run
node .output/server/index.mjs
```

### Variáveis de Ambiente em Produção

Em ambiente de produção, configure:

```env
NODE_ENV=production
NUXT_PUBLIC_APP_NAME=MacroView Pro
# APIs opcionais
TWELVE_DATA_API_KEY=your_production_key
GEMINI_API_KEY=your_production_key
```

## Troubleshooting

### Problemas Comuns

**1. Dados não carregam:**
- Verifique conexão com internet
- Check status das APIs em https://status.awesomeapi.com.br
- Verifique rate limits das APIs

**2. VIX/DXY não atualizam:**
- Yahoo Finance pode estar temporariamente indisponível
- Aguarde alguns minutos e recarregue

**3. Análise Gemini não funciona:**
- Verifique se a API key está configurada no .env
- Sem API key, o sistema usa análise fallback local
- Verifique quota da API em https://aistudio.google.com/app/apikey

**4. CORS errors no desenvolvimento:**
- Use `npm run dev` - Nuxt proxy resolve automaticamente
- Não use extensões CORS no navegador

**5. Memory leaks em dev:**
- Reinicie o servidor de desenvolvimento (`npm run dev`)
- É normal vazamentos menores em hot-reload

### Logs de Debug

Para ver logs detalhados:

```bash
# Modo debug
DEBUG=* npm run dev

# Ver logs do servidor
npm run dev 2>&1 | grep -E "(ERROR|api|fetch)"
```

## Licença

MIT License - Uso livre para fins educacionais e comerciais.

## Créditos

- **Metodologia de Trading**: Diego Bessil - TSR Investimentos
- **Desenvolvimento**: Laercio Monteiro - Sócio-trader na TSR Investimentos
- **APIs de Dados**: AwesomeAPI, Yahoo Finance, Twelve Data

---

**Aviso Legal**: Este dashboard é uma ferramenta de análise macroeconômica para fins educacionais. Não constitui conselho financeiro ou recomendação de investimento. Operações em mercados futuros envolvem riscos significativos. Sempre faça sua própria análise antes de tomar decisões de trading.