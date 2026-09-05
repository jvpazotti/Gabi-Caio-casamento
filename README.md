# Casamento de Caio & Gabriela

Site estático em português e inglês, baseado na versão 13 enviada pela Gabriela.
HTML, CSS e JavaScript, sem instalação de dependências ou etapa de build.

## Organização

- `index.html`: página principal, listas de presentes e formulários.
- `pix.html`: página de presente via Pix, aberta em uma nova aba.
- `obrigada.html`: agradecimento após o envio de recados.
- `assets/css/`: estilos do site e da página Pix.
- `assets/js/script.js`: contagem regressiva, navegação, animações e RSVP.
- `assets/js/i18n.js`: traduções PT/EN compartilhadas.
- `assets/js/pix-config.js`: imagem, código e destinatário do Pix.
- `assets/js/pix.js`: exibição do Pix e botão de copiar.
- `assets/images/`: fotos, monograma e futuro QR Code.
- `docs/`: instruções e histórico recebidos junto com a versão original.

## Visualizar localmente

Na raiz do repositório, execute:

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Para encerrar, use Ctrl+C.
O servidor local permite revisar o visual e a navegação. O recebimento de
formulários depende do Netlify Forms e não funciona nesse servidor local.

## Concluir a configuração do Pix

**Pendente:** o casal ainda precisa fornecer os dados do banco. Enquanto isso,
a página mostra “Nosso Pix estará disponível em breve”, sem QR ou código fictício.

1. Solicite ao casal a imagem original do QR Code de recebimento da conta conjunta
   e o Pix Copia e Cola correspondente. Para uma lista aberta de presentes,
   prefira um código de recebimento reutilizável, sem valor fixo e sem vencimento.
2. Salve a imagem como `assets/images/pix-conta-conjunta.png`, preservando sua margem branca.
3. Preencha `qrImage` com esse caminho em `assets/js/pix-config.js`.
4. Cole o código completo em `copyPaste`. Esse campo habilita o botão de copiar.
   O site usa exatamente o código do banco, sem gerar nem alterar dados de pagamento.
5. Se desejar, preencha `recipient` com o nome exibido pelo banco.
6. Abra a página Pix e confira, no aplicativo do banco, se o QR Code e o código
   copiado identificam a conta conjunta correta. Não é preciso concluir uma transferência.

Apenas a imagem já habilita o QR Code; apenas o código habilita o Copia e Cola.
Se a imagem não carregar, o código continua disponível, quando preenchido.
Se nenhum dos dois estiver disponível, a mensagem de disponibilidade futura permanece.
O botão de copiar funciona em HTTPS ou localhost. Se o navegador bloquear a cópia,
o texto é selecionado para cópia manual.

## Hospedagem e formulários

A estrutura existente de Netlify Forms foi preservada. Ao conectar este repositório
ao Netlify, a pasta publicada é a raiz (`.`), sem comando de build.
Consulte `docs/CONFIGURAR-EMAILS-NETLIFY.txt` para as configurações originais de email.
Esses documentos são referências recebidas; não representam publicação ou configuração
realizada nesta alteração. Valide o recebimento de RSVP e recados na hospedagem.
