# Desafio de código BGC Brasil

Este repositório contém o desafio técnico para a **BGC Brasil**. O objetivo é realizar o web scraping dos produtos mais vendidos da Amazon, persistir os dados em um banco NoSQL (DynamoDB) e disponibilizar uma API Serverless para consulta.

---

## 🛠 Tecnologias Utilizadas

### Scraper
- **Node.js v24:** Aproveitando o suporte nativo a TypeScript (sem necessidade de compiladores externos).
- **Puppeteer + Stealth Plugin:** Para automação de browser com técnicas de evasão de anti-bot.
- **Zod:** Validação rigorosa de variáveis de ambiente e esquemas de dados.

### API (Serverless)
- **Node.js v20:** Runtime otimizado para AWS Lambda.
- **Serverless Framework v3:** Orquestração de infraestrutura como código (IaC).
- **AWS Lambda & API Gateway:** Computação escalável e gestão de endpoints.
- **AWS DynamoDB:** Banco de dados NoSQL de baixa latência.
- **Esbuild:** Bundler extremamente rápido para minimizar o tempo de cold start.

---

## 🏗 Decisões de Arquitetura e Design

### 1. Organização do Repositório
Optei por uma estrutura simples de pastas (`/api` e `/scraper`) em vez de ferramentas como *Monorepos (Turbo/Workspaces)*. Dado o escopo enxuto do projeto, essa abordagem evita complexidade desnecessária e repetição de configurações pesadas, mantendo o projeto ágil.

### 2. Injeção de Dependência Manual
Implementei o padrão **Repository** e **Injeção de Dependência** em ambos os projetos:
- **API:** A injeção é feita manualmente no handler. Evitei frameworks de DI (como Inversify ou NestJS) para garantir que o **Cold Start** da Lambda seja o menor possível, reduzindo latência e custos operacionais.
- **Scraper:** A lógica de extração é separada dos providers de dados. Isso permite trocar a Amazon pelo Mercado Livre, por exemplo, alterando apenas o provider, sem tocar na lógica de negócio.

### 3. Estratégia de Scraping & Anti-Bot
A Amazon possui mecanismos rigorosos contra automação. Para mitigar bloqueios:
- Utilizei o `puppeteer-extra-plugin-stealth` para mascarar as propriedades do navegador.
- Implementei **delay aleatório**, simulação de **movimentação de mouse** e **scroll suave** na página.
- O scraping é executado **sequencialmente**. Embora o paralelismo fosse mais rápido, a execução sequencial reduz o risco de *throttling* (bloqueio por excesso de requisições) do IP.
- O scraper percorre as categorias principais e extrai o **Top 3** de cada uma.

### 4. Padronização
- **Biome:** Utilizado para Linting e Formatação, garantindo um código limpo e performático.
- **Conventional Commits:** Histórico de versionamento organizado em inglês para facilitar o rastreamento de mudanças.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js v20+
- Docker (opcional, para o DynamoDB Local) ou Plugin Serverless DynamoDB Local instalado.

### 1. Configuração da API
```bash
cd api
npm install
# Iniciar o DynamoDB Local e a API
npx sls dynamodb install
npx sls offline start --stage local
```
A API estará disponível em `http://localhost:3000`.

### 2. Configuração do Scraper
```bash
cd scraper
npm install
# Configure o seu .env com base no .env.example
npm run start
```

---

## ☁️ Deploy e População na Nuvem

### Deploy da Infraestrutura
Dentro da pasta `/api`:
```bash
npx sls deploy --stage dev
```

### População do Banco Remoto
Após o deploy, você pode usar o scraper local para popular o banco de dados na AWS:
1. No arquivo `.env` do scraper, altere para os dados de produção.
2. Certifique-se de que suas credenciais AWS estão configuradas no ambiente.
3. Execute o scraper: `npm run start`.

---

## 📡 Documentação da API

### Listar Produtos
`GET /products`

**Filtro por Categoria:**
`GET /products?category=Eletrônicos`

**Exemplo de Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Echo Dot (5ª Geração)",
      "price": 439.00,
      "category": "Eletrônicos",
      "rank": 1,
      "url": "https://amazon.com.br/...",
      "createdAt": "2025-12-19T..."
    }
  ]
}
```

**Testando com cURL:**
```bash
curl "(url em produção ou localhost)/products?category=(categoria desejada)"
```
