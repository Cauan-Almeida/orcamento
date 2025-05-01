# Sistema de Orçamentos Profissionais

Um sistema completo para criação de orçamentos profissionais, com geração de PDF, envio por WhatsApp e email.

## Funcionalidades

- Criação rápida de orçamentos
- Adição de produtos ou serviços
- Cálculo automático de totais
- Campos para observações
- Configuração personalizada de dados da empresa
- Geração de PDF profissional
- Envio por WhatsApp e Email
- Armazenamento local de orçamentos e configurações
- Numeração sequencial de orçamentos (ANO-SEQUENCIAL)

## Tecnologias

- React
- TypeScript
- Vite
- jsPDF e html2canvas (para geração de PDF)

## Como usar

1. Preencha os dados da empresa em "Configurar Empresa"
2. Adicione os dados do cliente
3. Adicione produtos ou serviços ao orçamento
4. Inclua observações se necessário
5. Gere o PDF ou envie diretamente por WhatsApp ou Email

## Como fazer o deploy

### Opção 1: Vercel (Recomendado)

A maneira mais simples de fazer o deploy é usando a Vercel:

1. Crie uma conta na [Vercel](https://vercel.com)
2. No GitHub, faça um fork deste repositório para sua conta
3. Na Vercel, clique em "New Project"
4. Importe seu repositório do GitHub
5. Mantenha as configurações padrão e clique em "Deploy"

Em poucos minutos seu aplicativo estará disponível online.

### Opção 2: Netlify

Outra excelente opção para deploy:

1. Crie uma conta na [Netlify](https://netlify.com)
2. No GitHub, faça um fork deste repositório para sua conta
3. Na Netlify, clique em "New site from Git"
4. Escolha GitHub como provedor e selecione seu repositório
5. Mantenha as configurações padrão e clique em "Deploy site"

### Opção 3: GitHub Pages

Para usar o GitHub Pages:

1. Instale a dependência gh-pages: `npm install --save-dev gh-pages`
2. Adicione ao package.json:
   ```json
   "homepage": "https://seuusuario.github.io/nome-do-repo",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Execute: `npm run deploy`

## Local Storage

Este aplicativo usa localStorage para:
- Salvar os dados da sua empresa
- Manter a numeração sequencial dos orçamentos
- Armazenar histórico de orçamentos gerados

Isto significa que seus dados permanecem salvos mesmo quando você fecha o navegador.

## Importante sobre emails

O sistema usa a função `mailto` para preparar emails, o que significa:
- Será aberto seu cliente de email padrão (Gmail web, Outlook, etc.)
- Você precisará anexar manualmente o PDF baixado
- O assunto e corpo do email são preenchidos automaticamente

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto está licenciado sob a licença MIT.
