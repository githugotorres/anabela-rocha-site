# Formulário de contacto: Google Sheet e email

Cada pedido enviado pelo formulário do site é guardado numa Google Sheet e enviado por email para anabelarocha-46953p@adv.oa.pt.

**Importante:** a Sheet e o script têm de ficar na conta Google da Dra. Anabela, ou numa conta que ela controle. Não usar a conta do Hugo nem a da Climiana: são dados de clientes de uma advogada.

Estes passos são feitos pela Dra. Anabela, com sessão iniciada na conta Google dela.

## 1. Criar a Google Sheet

1. Abrir [sheets.google.com](https://sheets.google.com) e criar uma folha em branco.
2. Dar-lhe um nome, por exemplo `Site, pedidos de contacto`.
3. Não é preciso criar colunas: o script cria o cabeçalho sozinho no primeiro pedido.

## 2. Colar o script

1. Na Sheet, abrir o menu **Extensões > Apps Script**.
2. Apagar o código que aparece e colar todo o conteúdo do ficheiro `apps-script/Codigo.gs` deste projeto.
3. Confirmar no topo do código que `NOTIFICATION_EMAIL` é `anabelarocha-46953p@adv.oa.pt`.
4. Guardar (ícone da disquete, ou Cmd+S / Ctrl+S).

## 3. Autorizar e testar

1. Na barra de cima do editor, escolher a função `testarFormulario` e carregar em **Executar**.
2. O Google vai pedir autorização para o script aceder à folha e enviar emails. Aceitar. Pode aparecer um aviso de "app não verificada", porque o script é dela e não foi publicado na loja do Google; nesse caso escolher **Avançadas** e continuar.
3. Confirmar que:
   - apareceu na Sheet, separador `Pedidos`, **uma** linha com `TESTE` na coluna "Teste";
   - chegou a anabelarocha-46953p@adv.oa.pt um email com `[TESTE]` no assunto (ver também o spam).
4. As linhas de teste podem ser apagadas a seguir.

## 4. Publicar como aplicação Web

1. No editor, carregar em **Implementar > Nova implementação** (em inglês: **Deploy > New deployment**).
2. No tipo, escolher **Aplicação Web** (**Web app**).
3. Preencher:
   - **Executar como:** Eu (a conta dela)
   - **Quem tem acesso:** Qualquer pessoa (**Anyone**)
4. Carregar em **Implementar** e copiar o **URL da aplicação Web**. Termina em `/exec`.
5. Enviar esse URL ao Hugo. Não é o link da Sheet.

"Qualquer pessoa" significa apenas que o site consegue enviar pedidos para o script. Ninguém consegue ler a Sheet através desse URL.

## 5. Ligar o site (Hugo)

No ficheiro `config.js`, colar o URL em `formEndpoint`:

```js
window.SITE_CONFIG = {
  formEndpoint: 'https://script.google.com/macros/s/XXXXX/exec',
};
```

É o único sítio onde o URL está definido. Testar a partir do site com dados fictícios (por exemplo, nome `TESTE`, email `teste@example.com`) e apagar essas linhas depois.

## Alterar o script mais tarde

Depois de alterar o código, ir a **Implementar > Gerir implementações**, editar a implementação existente (ícone do lápis) e escolher **Nova versão**. Assim o URL mantém-se. Criar uma "Nova implementação" gera um URL diferente, que teria de ser atualizado no `config.js`.

## Notas

- Proteção anti-spam: o formulário tem um campo escondido (honeypot). Se vier preenchido, o script responde como se tivesse corrido bem mas não grava nem envia nada. O script também valida todos os campos antes de gravar.
- O Google impõe limites diários ao envio de emails por Apps Script. Consultar as quotas atuais na documentação do Google; para o volume esperado de um formulário de contacto não deve ser um problema, mas convém confirmar.
- Se o email falhar, o pedido fica na mesma guardado na Sheet.
- O prazo de conservação dos dados é decidido pela Dra. Anabela (ver a política de privacidade). Apagar manualmente as linhas antigas da Sheet e os emails quando esse prazo terminar.
