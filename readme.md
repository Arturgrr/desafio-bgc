# Desafio BGC Brasil

## Visão geral
Monorepo simples com dois módulos:
- `api`: funções Serverless em Node.js que expõem HTTP API e persistem no DynamoDB.
- `scraper`: script em Node.js para coleta (ainda em construção).

## Configuração local da API
```sh
cd api
npm install
npm run dynamodb:install
npm run sls:offline
```
- A API sobe em `http://localhost:3000`.
- O DynamoDB local roda em memória na porta `8000`.