# Casamento de Caio & Gabriela

Site em português e inglês, baseado na versão 13 enviada pela Gabriela.
As páginas continuam em HTML, CSS e JavaScript. O mural usa Netlify Forms,
Functions e Blobs para receber, aprovar e exibir recados sem republicar o site.

## Organização

- `index.html`: página principal, listas de presentes e formulários.
- `pix.html`: página de presente via Pix, aberta em uma nova aba.
- `obrigada.html`: agradecimento usado no envio de recados sem JavaScript.
- `assets/css/`: estilos do site e da página Pix.
- `assets/js/script.js`: contagem regressiva, navegação e animações.
- `assets/js/forms.js`: envio, erro, confirmação e reinício de RSVP e recados.
- `assets/js/i18n.js`: traduções PT/EN compartilhadas.
- `assets/js/pix-config.js`: imagem, código, chave e destinatário do Pix.
- `assets/js/pix.js`: exibição do Pix e botão de copiar.
- `admin.html`: painel privado de aprovação de recados.
- `assets/js/mural.js`: mural público com mensagens aprovadas.
- `netlify/functions/`: API pública e API autenticada do mural.
- `netlify/lib/`: regras de aprovação e integração com Forms e Blobs.
- `scripts/build.mjs`: gera `dist` apenas com arquivos públicos.
- `tests/`: testes das regras de publicação e privacidade.
- `assets/images/`: fotos, monograma e futuro QR Code.
- `docs/`: instruções e histórico recebidos junto com a versão original.

## Visualizar localmente

Na raiz do repositório, com Node.js 22 ou superior:

```sh
npm ci
npm test
npm run build
npm run preview:demo
```

Abra `http://127.0.0.1:8005` ou `/admin.html` para o painel. A senha de demonstração
aparece no terminal. Os recados são fictícios e ficam apenas na memória desse
servidor; nenhum envio é feito ao Netlify. Para encerrar, use Ctrl+C.

Para somente visualizar as páginas, `python3 -m http.server 8000 --directory dist`
também funciona, mas esse servidor não executa as funções nem recebe formulários.

## Configuração do Pix

**Configurado:** QR Code do Itaú em nome de Caio de Faro Colen Nunes, chave Pix
celular +55 (11) 93751-1993, sem valor fixo (o convidado escolhe o valor).

Os dados ficam em `assets/js/pix-config.js`:

- `qrImage`: `assets/images/pix-qr.png`, recortada do QR original com margem branca.
- `copyPaste`: o código lido do próprio QR, sem alterações (CRC conferido).
- `recipient`: nome exibido pelo banco.
- `key` / `keyCopy`: a chave como aparece para o convidado e como é copiada.

Para trocar de conta, substitua a imagem e os campos acima pelos novos dados do banco.
O site usa exatamente o código do banco, sem gerar nem alterar dados de pagamento.
Depois, abra a página Pix e confira no aplicativo do banco se o QR Code e o código
copiado identificam o destinatário correto. Não é preciso concluir uma transferência.

Apenas a imagem já habilita o QR Code; apenas o código habilita o Copia e Cola;
apenas a chave habilita o botão de copiar a chave. Se nada estiver preenchido,
a página mostra “Nosso Pix estará disponível em breve”.
Os botões de copiar funcionam em HTTPS ou localhost. Se o navegador bloquear a cópia,
o código é selecionado para cópia manual.

## Hospedagem e formulários

A estrutura existente de Netlify Forms foi preservada, com um novo campo opcional
`autoriza_mural` nos recados. O `netlify.toml` configura `npm run build`, publicação
de `dist` e empacotamento das funções. A raiz do repositório não é a pasta pública.
O ZIP estático anterior não ativa o painel: esta versão precisa de um deploy via
Git ou Netlify CLI, incluindo as funções.
Siga [a configuração inicial do mural](docs/MURAL.md) para ativar o painel.
Consulte `docs/CONFIGURAR-EMAILS-NETLIFY.txt` para as configurações originais de email.
Esses documentos são referências recebidas; não representam publicação ou configuração
realizada nesta alteração. Valide o recebimento de RSVP e recados na hospedagem.
