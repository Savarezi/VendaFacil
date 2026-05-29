# VendaFácil ERP — Sistema Integrado de Gestão Comercial e Financeira

O **VendaFácil** é uma plataforma SaaS de alta performance projetada para otimizar e unificar as operações comerciais, financeiras e logísticas de micro, pequenas e médias empresas (PMEs). Com uma interface de altíssimo refinamento visual em *Dark Mode* corporativo e uma engenharia de dados à prova de falhas, o sistema oferece controle de ponta a ponta em tempo real.

---

## 📌 Tabela de Conteúdos

* [1. Sobre o VendaFácil ERP](#-sobre-o-vendafácil-erp)
* [2. Arquitetura e Fluxo do Core Engine](#-arquitetura-e-fluxo-do-core-engine)
* [3. Detalhamento dos Módulos Integrados](#-detalhamento-dos-módulos-integrados)
* [4. Estrutura de Pastas e Componentes](#-estrutura-de-pastas-e-componentes)
* [5. Stack Tecnológica de Alta Performance](#-stack-tecnológica-de-alta-performance)
* [6. Configuração e Inicialização Rápida](#-configuração-e-inicialização-rápida)
* [7. Esquema do Banco de Dados (Supabase/PostgreSQL)](#-esquema-do-banco-de-dados-supabasepostgresql)
* [8. Segurança e Conformidade](#-segurança-e-conformidade)
* [9. Desenvolvedor e Contato](#-desenvolvedor-e-contato)

---

## 🚀 Sobre o VendaFácil ERP

O VendaFácil foi concebido sob três pilares fundamentais:
1. **Densidade e Alta Fidelidade Visual:** Design elegante e compacto inspirado em ferramentas consolidadas do ecossistema SaaS mundial (como Stripe, Linear e Vercel). Cada elemento aproveita a viewport perfeitamente para evitar barras de rolagem desnecessárias.
2. **Robustez Transacional:** Todas as rotas de dados, desde lançamentos parciais no carrinho do PDV até conciliações de fluxo de caixa futuras, são transacionadas de forma atômica e segura.
3. **Sincronização Híbrida Inteligente:** Totalmente funcional em modo local/demonstrativo em memória, mas com acoplamento nativo à nuvem corporativa (Supabase PostgreSQL) ativada sob demanda por variáveis de ambiente seguras.

---

## ⚙️ Arquitetura e Fluxo do Core Engine

```
                             [ CAMADA DO CLIENTE (React 19 + Tailwind v4) ]
                                                   │
                          ┌────────────────────────┴────────────────────────┐
                          ▼                                                 ▼
               [ Autenticação Segura ]                            [ Gerenciador de Estado ]
                • Supabase Auth API                                • ErpContext (Context API)
                • Sessões protegidas no Storage                    • Estruturas TIPADAS estritas
                          │                                                 │
                          └────────────────────────┬────────────────────────┘
                                                   ▼
                                         [ Banco de Dados Híbrido ]
                                ┌──────────────────┴──────────────────┐
                                ▼                                     ▼
                      [ Modo Supabase Cloud ]               [ Modo Demonstrativo Local ]
                      • Conexão PostgreSQL Ativa            • Store local auto-gerenciado
                      • Políticas de Segurança (RLS)        • Transição imperceptível
```

---

## 📦 Detalhamento dos Módulos Integrados

*   **Frente de Caixa (PDV):** Processamento ágil de transações, controle flutuante de carrinho, busca indexada de produtos e pagamentos integrados.
*   **Catálogo de Produtos:** Controle rígido de custos médios, quantidades físicas, alertas de estoque mínimo e gerador de códigos EAN.
*   **Clientes & CRM:** Mapeamento de perfis de compradores, controle de limites de crédito para compras a prazo e histórico completo de transações.
*   **Fornecedores:** Gestão de parceiros, marcas vinculadas e canais de contato mercadológico.
*   **Compras & Entradas:** Registre a chegada de novos insumos com atualização automatizada de quantidades e recálculo do preço de custo médio ponderado.
*   **Fluxo de Caixa:** Lançamentos imediatos organizados por categoria (receitas, despesas, transferências) com relatórios instantâneos de caixa operacional diario.
*   **Contas a Pagar & Receber:** Gestão inteligente de faturas sob regime de competência, cronogramas de parcelamento de vendas a prazo e amortizações de débitos.
*   **Relatórios Inteligentes (BI):** Dashboards gerenciais dinâmicos exibindo Ticket Médio, faturamento mensal, Curva ABC de produtos e lucratividade integrada de forma limpa.

---

## 📂 Estrutura de Pastas e Componentes

A organização de diretórios do projeto foi padronizada para garantir a separação de responsabilidades (Separation of Concerns) e facilitar a manutenibilidade por times de engenharia experientes.

Abaixo está a representação tabular interativa da arquitetura do projeto. Clique em qualquer caminho ou arquivo para abrir diretamente no repositório:

| Caminho do Arquivo / Pasta | Tipo | Descrição e Propósito no ERP |
| :--- | :---: | :--- |
| [📂 `.assets/`](./.assets) | Diretório | Arquivos internos, relatórios de auditoria e logs gerenciais do workspace. |
| [📂 `src/`](./src) | Diretório | Diretório raiz que unifica todo o código-fonte principal da aplicação. |
|   ├── [📂 `src/components/`](./src/components) | Diretório | Coleção de todos os módulos de interface modularizados e blocos do sistema. |
|   │   ├── [📄 `Clientes.tsx`](./src/components/Clientes.tsx) | Arquivo | Gestão avançada de clientes, histórico de compras e limites de crédito ativos. |
|   │   ├── [📄 `Compras.tsx`](./src/components/Compras.tsx) | Arquivo | Mecanismo de entrada de mercadorias, notas fiscais e custos médios ponderados. |
|   │   ├── [📄 `ContasPagar.tsx`](./src/components/ContasPagar.tsx) | Arquivo | Controle programado de despesas, contas a vencer e calendário fiscal. |
|   │   ├── [📄 `ContasReceber.tsx`](./src/components/ContasReceber.tsx) | Arquivo | Controle dinâmico de faturamentos de clientes e parcelas pendentes. |
|   │   ├── [📄 `CustomChart.tsx`](./src/components/CustomChart.tsx) | Arquivo | Motor de gráficos proprietário integrado para análises estatísticas do BI. |
|   │   ├── [📄 `FluxoCaixa.tsx`](./src/components/FluxoCaixa.tsx) | Arquivo | Consolidação em tempo real de transações de entrada, saída e conciliações. |
|   │   ├── [📄 `Fornecedores.tsx`](./src/components/Fornecedores.tsx) | Arquivo | Agenda de parceiros, marcas vinculadas e distribuidoras comerciais. |
|   │   ├── [📄 `HistoricoVendas.tsx`](./src/components/HistoricoVendas.tsx) | Arquivo | Retrospectiva analítica de vendas com emissão de cupons não-fiscais. |
|   │   ├── [📄 `Login.tsx`](./src/components/Login.tsx) | Arquivo | Portal de autenticação premium em dark mode ultra refinado 100% viewport. |
|   │   ├── [📄 `PDV.tsx`](./src/components/PDV.tsx) | Arquivo | Terminal rápido de vendas presenciais com carrinho flutuante e atalhos. |
|   │   ├── [📄 `ProductTour.tsx`](./src/components/ProductTour.tsx) | Arquivo | Assistente inteligente guiado para onboarding inicial integrado do sistema. |
|   │   ├── [📄 `Produtos.tsx`](./src/components/Produtos.tsx) | Arquivo | Gestão do catálogo fiscal de mercadorias, margens de lucro e código EAN. |
|   │   └── [📄 `Relatorios.tsx`](./src/components/Relatorios.tsx) | Arquivo | Dashboard centralizado de BI, indicadores de ticket médio e curva ABC. |
|   ├── [📂 `src/context/`](./src/context) | Diretório | Gerenciamento global de estados corporativos e reatividade. |
|   │   └── [📄 `ErpContext.tsx`](./src/context/ErpContext.tsx) | Arquivo | Centralizador lógico do estado do ERP com transição de sincronização híbrida. |
|   ├── [📂 `src/lib/`](./src/lib) | Diretório | Conectores de comunicação e clientes de infraestrutura externos. |
|   │   └── [📄 `supabase.ts`](./src/lib/supabase.ts) | Arquivo | Inicialização resiliente do cliente Supabase e validação de chaves. |
|   ├── [📄 `App.tsx`](./src/App.tsx) | Arquivo | Hub estratégico de controle de abas, rotas e inicialização de sessão. |
|   ├── [📄 `index.css`](./src/index.css) | Arquivo | Diretivas taylor-made, customizações de fontes e regras do Tailwind CSS v4. |
|   ├── [📄 `main.tsx`](./src/main.tsx) | Arquivo | Ponto de entrada fundamental e inicializador React 19 do DOM do navegador. |
|   └── [📄 `types.ts`](./src/types.ts) | Arquivo | Centralizador estrito de tipos, payloads de auditoria e interfaces de dados. |
| [📄 `.env.example`](./.env.example) | Arquivo | Modelo de credenciais e chaves secretas do provedor de dados de nuvem. |
| [📄 `.gitignore`](./.gitignore) | Arquivo | Regras de ignore do repositório para privacidade técnica de dados locais. |
| [📄 `index.html`](./index.html) | Arquivo | Template principal e contêiner dinâmico do SPA. |
| [📄 `metadata.json`](./metadata.json) | Arquivo | Configuração técnica de permissões de hardware e título do aplicativo. |
| [📄 `package.json`](./package.json) | Arquivo | Manifesto do projeto com todas as dependências e scripts operacionais. |
| [📄 `SUPABASE_SCHEMA.sql`](./SUPABASE_SCHEMA.sql) | Arquivo | DDL completo do banco para implantação direta do PostgreSQL corporativo. |
| [📄 `tsconfig.json`](./tsconfig.json) | Arquivo | Configurações estritas do compilador estático de tipagem do TypeScript. |
| [📄 `vite.config.ts`](./vite.config.ts) | Arquivo | Mapeador de build de produção, alias de caminhos e comportamentos de dev. |

---

## 🛠️ Stack Tecnológica de Alta Performance

*   **Runtime & Engine de Visual:** [React 19](https://react.dev) — Interface reativa com renderização inteligente de árvore virtual de componentes.
*   **Compilador & Bundler:** [TypeScript 5](https://www.typescriptlang.org) + [Vite 6](https://vitejs.dev) — Transpilação ultrarrápida do código-fonte e compilação de alta performance para produção.
*   **Camada de Customização Estilística:** [Tailwind CSS v4](https://tailwindcss.com) — Utilidades de markup de última geração que viabilizam o dark mode premium de forma nativa e sem arquivos CSS redundantes.
*   **Bancos de Dados:** [PostgreSQL (via Supabase)](https://supabase.com) — Banco de dados relacional robusto com RLS (Row Level Security) integrado nativamente.
*   **Animações e Transições:** [Motion](https://motion.dev) — Biblioteca moderna de transição física suave para abas dadas por animações discretas.
*   **Iconografia Profissional:** [Lucide React](https://lucide.dev) — Vetores limpos e padronizados para compor o refinamento visual do ERP.

---

## 💻 Como Executar o Projeto

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18.x ou superior) instalado em sua máquina de trabalho.

### Passo 1: Clone o Repositório e Instale as Dependências
Abra seu terminal e execute:
```bash
# Navegue para o diretório de instalação
cd venda-facil-erp

# Instale os módulos necessários via NPM
npm install
```

### Passo 2: Configure as Variáveis de Ambiente (Opcional)
Se desejar integrar a aplicação ao banco de dados Supabase Cloud real, renomeie o arquivo `.env.example` para `.env` e preencha as chaves:
```env
VITE_SUPABASE_URL="https://seu-projeto-id.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-publica-recuperada-no-painel"
```
*Se as chaves não forem configuradas, o ERP entrará automaticamente no modo **Demonstrativo Local**, permitindo operação integral dos dados salvas na memória do navegador.*

### Passo 3: Inicialize em Ambiente de Desenvolvimento
```bash
npm run dev
```
O servidor de desenvolvimento local será iniciado na porta padrão. Acesse: `http://localhost:3000`

### Passo 4: Executar Lint e Build para Produção
Antes de implantar em servidores de produção, execute o validador estático e o compilador final:
```bash
# Executa validação de integridade de tipos TypeScript
npm run lint

# Constrói arquivos estáticos purificados para deploy na pasta /dist
npm run build
```

---

## 🛡️ Segurança e Conformidade

A engenharia por trás do **VendaFácil ERP** protege a sua operação contra as falhas mais comuns de segurança corporativa:
*   **Sem Vazamento de Segredos (Zero Exposure):** Chaves sensíveis de conexão à nuvem não são codificadas diretamente nas classes ou componentes. São mapeadas por injeção segura por variáveis no build-time do Vite (`import.meta.env`).
*   **Row-Level Security (RLS) no PostgreSQL:** As políticas do arquivo `SUPABASE_SCHEMA.sql` isolam rigorosamente os dados de cada tenant. Um usuário só consegue ler e gravar registros que pertençam explicitamente à sua ID corporativa registrada no Supabase Auth.
*   **Integridade Transacional Híbrida:** Bloqueios de concorrência garantem que o saldo do fluxo de caixa e o estoque físico nunca entrem em estado inconsistente ou negativo de forma fantasma.

---

## 👥 Desenvolvedor e Contato

Este projeto foi desenhado, polido e implementado com foco absoluto em código limpo, escalabilidade corporativa e excelência na experiência do usuário empresarial.

Desenvolvido por **Patrícia Savarezi**.

*   🌐 **LinkedIn:** [Acesse meu perfil profissional](https://www.linkedin.com/in/savarezi/)
*   💼 **Portfólio & Soluções:** Entre em contato para saber mais sobre arquitetura SaaS e soluções de alto impacto comercial.

---
*VendaFácil ERP — Elevando a gestão comercial para o próximo nível técnico.*
