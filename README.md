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

A organização de diretórios do projeto foi padronizada para garantir a separação de responsabilidades (Separation of Concerns) e facilitar a manutenibilidade por times de engenharia experientes:

```
├── 📁 .assets/                      # Arquivos internos e logs do workspace
├── 📁 src/                          # Diretório raiz com o código-fonte
│   ├── 📁 components/               # Todos os Módulos de Interface Modularizados
│   │   ├── 📄 Clientes.tsx          # Gestão de Compradores e Limites de Crédito
│   │   ├── 📄 Compras.tsx           # Entrada de Notas Fiscais e Reposição
│   │   ├── 📄 ContasPagar.tsx       # Controle de Compromissos de Despesas
│   │   ├── 📄 ContasReceber.tsx     # Gerenciamento de Duplicatas de Clientes
│   │   ├── 📄 CustomChart.tsx       # Componente Corporativo de Gráficos (Baseado em Recharts)
│   │   ├── 📄 FluxoCaixa.tsx        # Movimentação e Conciliação Financeira Diária
│   │   ├── 📄 Fornecedores.tsx      # Agenda Comercial de Fabricantes e Parceiros
│   │   ├── 📄 HistoricoVendas.tsx   # Dashboard de Transações passadas e Re-emissão de Cupons
│   │   ├── 📄 Login.tsx             # Tela de Autenticação Premium Compacta 100% Viewport
│   │   ├── 📄 PDV.tsx               # Terminal do Caixa (Carrinho Dinâmico, Atalhos e Pagamentos)
│   │   ├── 📄 ProductTour.tsx       # Guia Interativo de Onboarding Corporativo de Usuários
│   │   ├── 📄 Produtos.tsx          # Controle do Catálogo de Produtos e Código EAN
│   │   └── 📄 Relatorios.tsx        # Painel Centralizado de Business Intelligence e Médias
│   │
│   ├── 📁 context/                  # Gerenciamento Global do Estado da Aplicação
│   │   └── 📄 ErpContext.tsx        # Centralizador da Lógica e Abstração Supabase/Offline
│   │
│   ├── 📁 lib/                      # Conectores e Clientes de Infraestrutura Externa
│   │   └── 📄 supabase.ts           # Inicialização segura do cliente Supabase e Guards de Chaves
│   │
│   ├── 📄 App.tsx                   # Hub Central, Controle de Abas e Inicialização de Sessão
│   ├── 📄 index.css                 # Importação otimizada das diretivas do Tailwind CSS v4
│   ├── 📄 main.tsx                  # Ponto de entrada de renderização React do Navegador
│   └── 📄 types.ts                  # Definições Estritas de Tipos TypeScript (Interfaces Globais)
│
├── 📄 .env.example                  # Modelo de definições de variáveis de ambiente do sistema
├── 📄 .gitignore                    # Arquivos e artefatos de build ignorados no repositório
├── 📄 index.html                    # Esqueleto estático da página HTML principal do SPA
├── 📄 metadata.json                 # Metadados e permissões da plataforma
├── 📄 package.json                  # Manifesto de dependências e definições de Scripts NPM
├── 📄 SUPABASE_SCHEMA.sql           # Arquivo DDL completo para replicação do banco de dados no PostgreSQL
├── 📄 tsconfig.json                 # Configurações do compilador TypeScript
└── 📄 vite.config.ts                # Configuração de build, alias e HMR do bundler Vite
```

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
