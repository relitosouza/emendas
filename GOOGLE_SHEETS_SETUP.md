# Configuração do Google Sheets

Para habilitar o salvamento de dados no Google Sheets, você precisa configurar as seguintes variáveis de ambiente em um arquivo `.env.local` na raiz do seu projeto.

## 1. Criar `.env.local`
Crie um arquivo chamado `.env.local` em `c:\projects\PortalEmendas\` e adicione as seguintes chaves:

```ini
GOOGLE_SERVICE_ACCOUNT_EMAIL="seu-service-account@project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua Chave Privada Aqui...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="id-da-sua-planilha"
```

## 2. Obter Credenciais
1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2.  Crie um novo projeto (ou selecione um existente).
3.  Ative a **Google Sheets API** (API de Planilhas Google).
4.  Vá em **Credenciais** -> **Criar Credenciais** -> **Conta de Serviço** (Service Account).
5.  Crie a conta e, em seguida, vá para a aba "Chaves" dessa conta.
6.  Adicione uma nova chave (tipo JSON). Isso fará o download de um arquivo JSON.
7.  Abra o arquivo JSON:
    - Copie `client_email` para `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
    - Copie `private_key` para `GOOGLE_PRIVATE_KEY` (Mantenha os `\n` ou quebras de linha).

## 3. Configuração da Planilha
1.  Crie uma nova Planilha Google (Google Sheet).
2.  Copie o ID da URL (ex: `abc12345` de `docs.google.com/spreadsheets/d/abc12345/edit`).
    - Cole este ID em `GOOGLE_SHEET_ID`.
3.  **Compartilhar a Planilha**: Clique em "Compartilhar" na planilha e adicione o `client_email` (email da Conta de Serviço) como **Editor**. Isso é crucial para que o sistema possa escrever na planilha!

## 4. Estrutura das Colunas
Para que o sistema funcione corretamente, a primeira linha da sua planilha deve conter os seguintes cabeçalhos (nesta ordem exata):

1.  ID
2.  Data Criação
3.  Município
4.  CNPJ
5.  Nome Responsável
6.  Cargo Responsável
7.  LOA 2026 Check
8.  Âmbito
9.  Tipo Emenda
10. Tipo Emenda Outro
11. Fundamento Legal
12. Autor
13. Número Emenda
14. Objeto
15. Finalidade
16. Função
17. Destinação
18. Órgão Beneficiário
19. Localidade Beneficiada
20. Instrumento Jurídico
21. Possui Cronograma
22. Prazo Aplicação
23. Valor
24. Valor Autorizado
25. % RCL
26. Conta Específica
27. Número Conta
28. Portal Transparência Check
29. Divulgação Tempo Real
30. Link Portal
31. Monitoramento Check
32. Status
33. Prioridade
34. Latitude
35. Longitude
36. Categoria
37. Fornecedor
38. Número Licitação
39. Código de Aplicação
40. Código Aplicação Variável
41. Subfunção

## 5. Aba de Categorias (NOVO)
Crie uma **nova aba** (página) na mesma planilha com o nome: `Categorias`.
Esta aba servirá como referência para as categorias disponíveis no sistema, embora inicialmente elas sejam fixas no código.
Sugestão de colunas: `ID`, `Nome`.

> **Nota:** O sistema irá adicionar novas linhas abaixo destes cabeçalhos. Se você alterar a ordem, os dados serão salvos incorretamente.

## 5. Aba de Execução Financeira (NOVO)
Crie uma **nova aba** (página) na mesma planilha com o nome exato: `ExecucaoFinanceira`.

Adicione os seguintes cabeçalhos na **Linha 1**:

1. ID Emenda
2. Empenhado
3. Liquidado
4. Pago
5. Data Ultima Atualizacao

> Esta aba será usada para controlar os valores de execução, vinculados pelo ID da emenda.

## 5. Reiniciar o Servidor
Após criar o arquivo `.env.local`, reinicie seu servidor Next.js (`npm run dev`) para carregar as variáveis.
