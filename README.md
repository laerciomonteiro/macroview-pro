# MacroView Pro

Painel de Leitura Macroeconômica Automatizada para Day Traders

## Visão Geral

MacroView Pro é um dashboard institucional em tempo real projetado para day traders brasileiros focados em WDO (Dólar Futuro) e WIN (Mini Índice). O sistema monitora continuamente indicadores macroeconômicos globais e fornece interpretações automatizadas de cenários de mercado para auxiliar na tomada de decisão de trading.

O projeto foi desenvolvido seguindo a metodologia do trader Diego Bessil, integrando análise de fluxos globais, cenários de risco e correlações intermercado em uma interface unificada.

## Funcionalidades

- **Dashboard em Tempo Real**: Métricas de mercado atualizadas continuamente com cache inteligente
- **Cenários Automáticos**: Interpretação automática (Risk-On, Risk-Off, Neutro) baseada em indicadores
- **Agenda Econômica**: Monitoramento de eventos de alto impacto com volatilidade prevista
- **Matriz de Correlações**: Análise visual das correlações entre ativos e seus impactos no WDO/WIN
- **Auto-Refresh Inteligente**: Pausa automática quando a aba do navegador está oculta para economizar recursos

## Stack Tecnológica

- **Framework**: Nuxt 4 (SSR) com Vue 3 Composition API
- **Linguagem**: TypeScript em modo estrito
- **Estilização**: Tailwind CSS
- **State Management**: Pinia
- **Gráficos**: Lightweight Charts / VueChart.js
- **UI Components**: Headless UI
- **APIs de Dados**: AwesomeAPI, Yahoo Finance, Twelve Data (opcional), Commodities-API (opcional)

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
COMMODITIES_API_KEY=your_key_here

# Configurações Públicas
NUXT_PUBLIC_APP_NAME=MacroView Pro
NUXT_PUBLIC_APP_VERSION=1.0.0
```

### API Keys Necessárias

O sistema funciona com APIs gratuitas para a maioria dos dados. Apenas configurações opcionais requerem chaves:

| API | Status | Requer Key | Endpoint | Uso Principal |
|-----|--------|------------|----------|---------------|
| **AwesomeAPI** | Gratuita | Não | `economia.awesomeapi.com.br` | USD/BRL, EUR/BRL |
| **Yahoo Finance** | Gratuita | Não | `query1.finance.yahoo.com` | VIX, DXY, EWZ, Treasuries |
| **Twelve Data** | Opcional | Sim | `twelvedata.com` | XAU/USD mais preciso |
| **Commodities-API** | Opcional | Sim | `commodities-api.com` | Minério de ferro |

### Configurando API Keys Opcionais

#### Twelve Data (Opcional)
1. Acesse https://twelvedata.com/pricing
2. Registre-se para o plano gratuito (8 requests/minuto)
3. Adicione ao `.env`:
   ```
   TWELVE_DATA_API_KEY=sua_chave_aqui
   ```

#### Commodities-API (Opcional)
1. Acesse https://commodities-api.com
2. Registre-se para o plano gratuito
3. Adicione ao `.env`:
   ```
   COMMODITIES_API_KEY=sua_chave_aqui
   ```

## Arquitetura

### Visão Geral da Arquitetura

O MacroView Pro utiliza uma arquitetura híbrida Nuxt 4 com server routes para proxy de APIs e cache inteligente no servidor.

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
│  │  market-overview │ currencies │ risk-indicators │ etc...    ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Cache Layer (Memory)                      ││
│  │           60s para dados de mercado, 5min para eventos       ││
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
| `/api/currencies` | USD/BRL, EUR/BRL, GBP/BRL | AwesomeAPI | 60s |
| `/api/risk-indicators` | VIX, DXY, ETF BR (EWZ) | Yahoo Finance | 60s |
| `/api/commodities` | Brent, Ouro, Minério de Ferro | Yahoo/Commodities-API | 60s |
| `/api/brazil-flow` | ETF EWZ (fluxo estrangeiro Brasil) | Yahoo Finance | 60s |
| `/api/treasuries` | Treasury 10yr (TNX), 5yr | Yahoo Finance | 60s |
| `/api/events` | Agenda econômica com impacto | Events Utils | 5min |
| `/api/correlations` | Matriz de correlações | Computado | 1h |

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
│   │   ├── CorrelationCard.vue     # Card de ativo correlacionado
│   │   ├── CorrelationChart.vue     # Gráfico de linha temporal
│   │   ├── InsightCard.vue          # Card de insight de correlação
│   │   ├── MatrixTable.vue          # Tabela矩阵 de correlações
│   │   └── ScenarioDetailCard.vue  # Detalhes do cenário atual
│   ├── market/
│   │   ├── MarketCard.vue           # Card de métrica de mercado
│   │   ├── MetricGrid.vue          # Grade de métricas
│   │   └── ScenarioCard.vue        # Card de cenário (Risk-On/Off)
│   └── ui/
│       └── TimeDisplay.vue         # Componente de exibição de hora UTC
├── composables/
│   ├── useAutoRefresh.ts           # Auto-refresh com Page Visibility API
│   ├── useMacroAnalysis.ts         # Análise macroeconômica
│   └── useMarketData.ts            # Fetch de dados de mercado
├── layouts/
│   └── default.vue                 # Layout padrão com sidebar
├── pages/
│   ├── agenda.vue                  # Página da agenda econômica
│   ├── correlacoes.vue             # Página da matriz de correlações
│   ├── dashboard.vue               # Página principal do dashboard
│   └── index.vue                   # Redirecionamento para dashboard
├── server/
│   ├── api/
│   │   ├── brazil-flow.get.ts      # API de fluxo Brasil (EWZ)
│   │   ├── commodities.get.ts       # API de commodities
│   │   ├── correlations.get.ts     # API de correlações
│   │   ├── currencies.get.ts        # API de câmbio
│   │   ├── events.get.ts           # API de eventos econômicos
│   │   ├── market-overview.get.ts   # API consolidada
│   │   ├── risk-indicators.get.ts   # API de indicadores de risco
│   │   └── treasuries.get.ts       # API de treasuries
│   ├── types/
│   │   └── market.ts               # Tipos TypeScript para market
│   └── utils/
│       ├── cache.ts                # Utilitário de cache em memória
│       ├── events.ts               # Utilitário de eventos econômicos
│       └── yahooFetcher.ts         # Fetch com retry para Yahoo
├── stores/
│   └── market.ts                    # Store Pinia para dados de mercado
├── types/
│   ├── calendar.ts                 # Tipos para calendário
│   ├── correlation.ts              # Tipos para correlações
│   └── market.ts                   # Tipos gerais de mercado
├── nuxt.config.ts                  # Configuração Nuxt
├── tailwind.config.ts              # Configuração Tailwind
├── package.json                    # Dependências npm
└── tsconfig.json                   # Configuração TypeScript
```

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
- **WIN tends to rise** (esperar-buy, pressão compradora)
- **WDO tends to fall** (dólar mais fraco)

**Sinais de Confirmação Risk-On:**
- S&P 500 em alta
- Commodities em alta
- Moedas emergentes fortalecendo

#### Risk-Off (Fuga para Qualidade)

**Condições para Risk-Off:**
- VIX > 20 (medo elevado, volatilidade alta)
- DXY em tendência de alta (dólar fortalecendo globalmente)
- Ouro subindo (busca por segurança, fluxo para haven)

**Interpretação para Trading:**
Capital foge para ativos seguros e refúgio. Nesse cenário:
- **WIN tends to fall** (pressão vendedora)
- **WDO tends to rise** (dólar mais forte)

**Sinais de Confirmação Risk-Off:**
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

### Correlações Intermercado

A matriz de correlações é uma ferramenta visual que mostra como diferentes ativos se relacionam e seu impacto potencial no WDO e WIN.

#### Tabela de Correlações

| Ativo | Correlação | Impacto no WIN | Impacto no WDO |
|-------|------------|----------------|----------------|
| **Ouro (XAU/USD)** | Inversão com DXY | Negativo quando DXY sobe | Positivo quando DXY sobe |
| **VIX < 15** | Risk-On | Positivo | Negativo |
| **VIX > 20** | Risk-Off | Negativo | Positivo |
| **EWZ ETF** | Fluxo Brasil | Positivo | Negativo |
| **Brent > 80** | Commodity/Brasil | Positivo | Negativo |
| **TNX subindo** | Juros US em alta | Negativo | Positivo |
| **DXY subindo** | Dólar forte | Negativo | Positivo |

#### Interpretação da Matriz

**Linha do Ouro (Gold Line):**
Ouro tem correlação negativa forte com DXY. Quando ambos sobem, indica risk-off genuíno e WDO tende a subir mais.

**Linha do VIX:**
VIX acima de 20 é o sinal mais forte de Risk-Off. Mesmo com DXY lateral, VIX elevado sugere cautela com WIN.

**Linha do EWZ:**
EWZ é termômetro do fluxo estrangeiro no Brasil. EWZ em alta = fluxo entrando = favorável para WIN.

**Linha de Treasuries (TNX):**
Treasuries subindo (rendimentos mais altos) atraem capital para EUA = DXY mais forte = impacto negativo no WIN.

### Indicadores Principais e Seus Significados

| Indicador | Descrição | Range Normal | Interpretação |
|-----------|-----------|--------------|---------------|
| **VIX** | Índice de Volatilidade CBOE | 10-30 | <15=calm, >20=fear |
| **DXY** | Índice Dólar Americano | 95-110 | >102=strong dollar |
| **EWZ** | ETF Brasil | 30-50 | >high=flow in |
| **TNX** | Treasury 10yr Yield | 3-5% | >4.5%=high rates |
| **Ouro** | XAU/USD | 1900-2100 | >2000=risk-off |

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
2. **Cards de Cenário**: Identificação automática do cenário atual (Risk-On/Risk-Off/Neutro) com justificativa
3. **Grid de Métricas**: 
   - USD/BRL (Dólar Comercial)
   - EUR/BRL (Euro)
   - VIX (Volatilidade)
   - DXY (Índice Dólar)
   - EWZ (ETF Brasil)
   - Ouro (XAU/USD)
   - Brent (Petróleo)
   - TNX (Treasury 10yr)
4. **Interpretação**: Texto explicativo do cenário do dia

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
   - `COMMODITIES_API_KEY`
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
COMMODITIES_API_KEY=your_production_key
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

**3. CORS errors no desenvolvimento:**
- Use `npm run dev` - Nuxt proxy resolve automaticamente
- Não use extensões CORS no navegador

**4. Memory leaks em dev:**
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

- **Metodologia de Trading**: Diego Bessil
- **Desenvolvimento**: Equipe MacroView
- **APIs de Dados**: AwesomeAPI, Yahoo Finance, Twelve Data, Commodities-API

---

**Aviso Legal**: Este dashboard é uma ferramenta de análise macroeconômica para fins educacionais. Não constitui conselho financeiro ou recomendação de investimento. Operações em mercados futuros envolvem riscos significativos. Sempre faça sua própria análise antes de tomar decisões de trading.
