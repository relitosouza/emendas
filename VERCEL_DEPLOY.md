# Solução de Problemas no Vercel (Google Sheets)

Se você hospedou o projeto na Vercel e ele não está acessando a planilha, o problema quase sempre está na formatação da variável de ambiente `GOOGLE_PRIVATE_KEY`.

## Passo a Passo para Corrigir

1.  Acesse o Painel do seu projeto na **Vercel**.
2.  Vá em **Settings** > **Environment Variables**.
3.  Verifique se você adicionou as 3 variáveis obrigatórias:
    *   `GOOGLE_SHEET_ID`
    *   `GOOGLE_SERVICE_ACCOUNT_EMAIL`
    *   `GOOGLE_PRIVATE_KEY`

### ⚠️ O Problema Comum: `GOOGLE_PRIVATE_KEY`

A Vercel muitas vezes interpreta mal as quebras de linha (`\n`) da chave privada quando você copia e cola diretamente do arquivo JSON.

**Como corrigir:**

1.  Abra o arquivo `.json` das credenciais do Google que você baixou.
2.  Copie o conteúdo de `private_key` (tudo que está entre as aspas, incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`).
3.  **Na Vercel:** Edite a variável `GOOGLE_PRIVATE_KEY`.
4.  Cole o valor.
    *   **Importante:** Se o valor copiado tiver `\n` literais (ex: `...KEY-----\nMII...`), certifique-se de que eles sejam tratados como quebras de linha reais ou a aplicação saiba lidar com eles.
    *   **Dica:** O código do projeto já foi atualizado para tentar corrigir automaticamente (`key.replace(/\\n/g, "\n")`), mas a melhor prática é garantir que a chave esteja limpa.

### Testando a Conexão

Após atualizar as variáveis na Vercel, você deve **Redeploy** (reimplantar) sua aplicação para que as alterações tenham efeito (ou apenas aguarde se for uma variável de Preview/Development, mas para Production geralmente requer redeploy).

1.  Vá na aba **Deployments**.
2.  Clique nos 3 pontinhos do último deploy e escolha **Redeploy**.
3.  Verifique se o acesso ao `/admin` e à listagem de emendas funciona.

### Configuração do Google Sheets

Lembre-se também de compartilhar sua planilha com o e-mail da conta de serviço:
1.  Abra sua planilha no Google Sheets.
2.  Clique em **Compartilhar**.
3.  Cole o e-mail do `GOOGLE_SERVICE_ACCOUNT_EMAIL` (ex: `projeto-emendas@....iam.gserviceaccount.com`).
4.  Dê permissão de **Editor**.

Se isso não for feito, a API retornará erro 403 (Forbidden) mesmo com a chave correta.
