# Validação local — 05/09/2026

Verificação do código e do navegador, com respostas HTTP simuladas em servidor
local. Nenhum formulário foi enviado ao ambiente publicado ou por email.

## Fluxos conferidos

- RSVP: restrição alimentar inicialmente oculta; aparece com “sim”, é limpa
  e fica desabilitada com “não”.
- Campos obrigatórios: nomes compostos apenas de espaços são rejeitados.
- RSVP e recados: HTTP 503 mostra erro, mantém os dados e libera nova tentativa.
- Recados: durante uma resposta lenta, o botão fica desabilitado e mostra
  “Enviando…”, com o formulário marcado como ocupado para acessibilidade.
- RSVP e recados: HTTP 200 simulado oculta o formulário e leva o foco à confirmação.
- Os botões de novo envio limpam os campos e devolvem o foco ao nome.
- Inglês: datas, horário, ações e mensagens traduzidos.
- Todos os atalhos internos apontam para elementos existentes.
- Menu móvel: abre, fecha com Esc e devolve o foco ao botão; sem rolagem horizontal
  na largura de 390 pixels testada.
- Referências locais de HTML e sintaxe dos JavaScripts válidas.

## Comportamento implementado

Os envios usam POST para `/`, com `form-name=rsvp` ou `form-name=recados`, mantendo
os nomes de campos e a marcação Netlify Forms. A espera tem limite de 20 segundos.
Após erro ou timeout, não há reenvio automático: o convidado decide tentar novamente.
O bloqueio de cliques repetidos vale durante a requisição; não é deduplicação no servidor.

Com JavaScript, recados agora confirma na própria página. O `action` original
para `obrigada.html` permanece como alternativa nativa.

## Ainda depende da hospedagem

Uma resposta HTTP 200 simulada verifica apenas o comportamento da interface.
É necessário identificar o projeto publicado e confirmar a detecção dos dois
formulários, o armazenamento das submissões e a entrega das notificações por email.
Se for usada uma hospedagem diferente, ela precisa disponibilizar um serviço que
receba esses POSTs; os arquivos estáticos não armazenam as respostas sozinhos.

O Pix continua aguardando os dados reais do banco. Mural público e moderação de
recados não fazem parte desta implementação.
