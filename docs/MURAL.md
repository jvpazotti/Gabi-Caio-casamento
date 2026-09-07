# Ativar e usar o mural

## Como funciona

1. O convidado envia o formulário `recados`, recebido pelo Netlify Forms.
2. Pode marcar a autorização para publicar seu nome e sua mensagem. Sem essa
   autorização, o recado fica privado e o painel não permite publicá-lo.
3. O casal abre `/admin.html` e entra com a senha do painel.
4. Em **Recebidos**, lê o texto e escolhe **Publicar no mural** ou **Manter privado**.
5. Em **Publicados**, pode retirar qualquer mensagem. O envio original continua
   no Netlify Forms, e a próxima consulta do mural já reflete a retirada.

Publicar não exige outro deploy. As decisões ficam em um store privado de Netlify
Blobs (`wedding-guestbook`), persistente entre deploys. A API pública devolve apenas
nome, mensagem e identificador dos recados aprovados e autorizados.

## Configuração inicial no Netlify

Use o projeto existente do casamento. Esta versão inclui funções; o ZIP antigo,
com apenas arquivos estáticos, não ativa a administração.

1. Conecte o repositório ao projeto, ou use o Netlify CLI para fazer o deploy
   completo. O arquivo `netlify.toml` define o build `npm run build`, a pasta
   pública `dist` e as funções de `netlify/functions`.
2. Mantenha **Forms → Enable form detection** ativado antes do deploy.
3. Gere uma senha exclusiva no seu terminal:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Guarde os 64 caracteres no gerenciador de senhas. Essa é a senha que o casal
   usará em `/admin.html`; não é a senha da conta Netlify.
4. Nas variáveis de ambiente do projeto, configure `MURAL_ADMIN_SECRET` com essa
   senha e `MURAL_NETLIFY_TOKEN` com um Personal Access Token da conta que tem
   acesso ao projeto. Disponibilize as duas variáveis para **Functions** e para
   o contexto **Production**. Não coloque valores no código, em HTML ou no Git.
   O token é usado no servidor para ler o formulário `recados`; o navegador
   nunca recebe o token da conta Netlify.
5. Publique o projeto completo. O identificador do site é obtido pelo contexto
   da função Netlify. As funções são `mural` e `mural-admin`.
6. Confira em Forms se o formulário `recados` inclui `autoriza_mural`. O novo
   campo só é detectado depois deste deploy. Mantenha as notificações de email
   já configuradas; elas continuam independentes do mural.
7. Abra `/admin.html`, entre e faça um teste identificado como teste: envie um
   recado com autorização, confirme que ele aparece como pendente, publique,
   confira no mural e retire. Envie também um sem autorização e confira que
   não existe ação de publicação para ele.

Se o painel informar que falta configuração, confira as variáveis e publique
novamente após alterações. Não gere nem cole tokens no JavaScript público.

## Uso pelo casal

- **Recebidos** lista 20 mensagens por página. Use **Próximos** para continuar.
- **Atualizar** busca novos recados no Netlify.
- **Publicados** reúne todas as mensagens atualmente no mural.
- A senha fica somente na memória da aba. **Sair**, recarregar ou 30 minutos
  sem chamadas ao painel exigem uma nova entrada.
- Se uma ação responder que a lista mudou, atualize e tente novamente: podem
  ter chegado novos recados entre a leitura e a aprovação.
- Recados antigos sem o campo de autorização continuam privados. O convidado
  pode enviar novamente usando a opção do formulário atual.
- Para remover uma mensagem pública, use **Retirar do mural** no painel.
  Excluir a submissão original em Forms não apaga uma publicação já aprovada.
- Aprovações concorrentes do mesmo recado seguem a última decisão salva.

## Validação e limites

Testes automatizados cobrem autenticação, origem, consentimento, privacidade,
aprovação idempotente, retirada, paginação, falhas e isolamento do formulário.
A prévia local simula Forms e Blobs; não comprova credenciais, disponibilidade
do serviço, quotas do plano ou entrega de emails no Netlify real.

Referências oficiais:
- [Netlify Functions](https://docs.netlify.com/build/functions/get-started/)
- [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Netlify API](https://open-api.netlify.com/)
- [Detecção de formulários](https://docs.netlify.com/manage/forms/setup/)
