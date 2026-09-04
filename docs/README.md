# Hellijhon — DJ & Producer

Site estático (HTML + CSS + JS puro, sem build). É só abrir ou subir os arquivos.

## Estrutura

```
docs/
├── index.html          página única com todas as seções
├── css/style.css       design system + layout + animações
├── js/main.js          preloader, scrollspy, reveal, canvas, lightbox
└── assets/
    ├── svg/            logo (branca e versão currentColor)
    └── img/            retratos + pasta gal/ com a galeria
```

## Rodar localmente

```bash
cd docs && python3 -m http.server 8000
```

Depois abra http://localhost:8000

> Abrir o `index.html` direto pelo Finder (`file://`) também funciona, mas alguns
> navegadores bloqueiam recursos locais — o servidor acima evita isso.

## Publicar

Suba a pasta `docs/` inteira em qualquer hospedagem estática
(Netlify, Vercel, GitHub Pages, Cloudflare Pages, ou FTP comum).
Não há dependências nem etapa de build.

## Paleta (pasta REFERENCIAS)

| Token | Hex | Uso |
|---|---|---|
| Dark Royal Blue | `#000675` | brilhos e profundidade |
| Navy | `#04044A` | fundos e painéis |
| Sky Blue | `#00A4FF` | acento principal |
| Neon Blue | `#00E7FF` | destaques, LEDs, gradientes |
| White | `#FFFFFF` | texto |

As variáveis ficam no topo de `css/style.css` (`:root`) — mudar ali propaga
para o site inteiro.

## Onde editar as coisas

| O quê | Onde |
|---|---|
| Textos, links, redes | `index.html` |
| Cores, espaçamentos, fontes | `:root` no topo de `css/style.css` |
| Fotos da galeria | `assets/img/gal/` + bloco `<div class="gal">` no HTML |
| Player do SoundCloud | bloco `<article class="player">` — o `src` do `<iframe>` e o widget oficial |
| Plataformas (Ouça agora) | bloco `<div class="platforms">` — cada card tem `--brand` com a cor da marca |
| Retrato do hero | `assets/img/header-cut.jpg` + `assets/img/header-mask.png` (ver nota abaixo) |
| Controladora (Bio) | `assets/img/cdj3000.jpg` + `cdj3000-mask.png` (mesma tecnica do hero) |
| Níveis dos faders (seção Som) | atributo `style="--lvl:92%"` em cada `.chan__fader span` |

Ao trocar uma foto da galeria, atualize também os atributos `width` e `height`
da `<img>` — é o que mantém as colunas do mosaico equilibradas e evita
o layout "pular" enquanto carrega.

## O recorte do hero

O retrato do hero e um recorte sem fundo, servido como **dois arquivos** em vez de
um PNG com transparencia:

- `header-cut.jpg` — a imagem em RGB sobre preto (131 KB)
- `header-mask.png` — preto puro carregando o recorte no canal alpha (56 KB)

O CSS junta os dois com `mask-image`. O PNG transparente equivalente pesava
889 KB — quase 5x mais — e este e o elemento LCP da pagina.

Para trocar essa foto, gere os dois arquivos a partir do novo recorte
(o `Visualizar` do macOS faz o recorte com "Remover fundo"). Se preferir um PNG
transparente unico, aponte o `<img>` para ele e apague as linhas `--mk-cut` /
`mask-image` do bloco `.hero__cut img,.hero__scan` no CSS.

## Acessibilidade / performance

- Imagens da galeria com `loading="lazy"` e dimensões declaradas.
- Lightbox navegável por teclado (Enter/Espaço para abrir, ← → para trocar, Esc para fechar).
- `prefers-reduced-motion` desliga todas as animações.
- Nenhuma dependência externa além do Google Fonts (Poppins) e do widget do SoundCloud.

## Música de fundo

O reprodutor flutuante toca `assets/audio/no-need-to-hide.m4a` em loop.
O MP3 original (320 kbps, 8,8 MB) foi reencodado para AAC 128 kbps — 3,5 MB —
porque o arquivo começa a baixar assim que a pagina abre.

**Sobre o início automático:** navegadores bloqueiam áudio antes de qualquer
interação do usuário; nao existe forma de contornar isso, e nao adianta insistir.
O código tenta tocar no load e, se for recusado, entra sozinho no primeiro
clique/toque/tecla da pessoa. Ou seja: em parte dos casos a música só comeca
quando o visitante interage — o botao sempre mostra o estado real.

Detalhes:
- volume inicial em 45%, lembrado entre visitas (`localStorage`)
- se a pessoa pausar, o site **nao** volta a tocar sozinho nas próximas visitas
- quem tem "reduzir movimento" ligado nao recebe início automático
- no celular o controle de volume fica oculto: o iOS nao permite que a pagina
  altere o volume, isso é so pelos botoes do aparelho

Para trocar a faixa, substitua o arquivo em `assets/audio/` e atualize o `src`
do `<audio id="fpAudio">` mais o título/artista em `.fp__meta`.

## Animação de abertura

A logo se desenha sozinha na entrada. O SVG está **inline** no `index.html`
(dentro de `#introShapes`) — precisa ser inline para os traços serem animáveis;
o `logo-white.svg` do topo e do rodapé continua sendo um `<img>` normal.

Como funciona: o JS mede cada um dos 9 shapes com `getTotalLength()`, ordena da
esquerda para a direita pelo `getBBox().x` e escalona o início de cada um em 55ms.
O contorno azul é desenhado com `stroke-dashoffset`, e no fim o preenchimento
branco entra por cima. Depois vem o pulso de brilho, a varredura de luz e a saída.

Duração total: cerca de 2s.

**Roda uma vez por aba.** Em recargas a logo aparece já preenchida e sai em ~0,4s,
para não cansar em visitas repetidas. Para tê-la em toda visita, troque no topo
do `js/main.js`:

```js
var INTRO_UMA_VEZ_POR_SESSAO = false;
```

Quem tem "reduzir movimento" ligado no sistema pula direto para a logo pronta.
Existe também uma trava de 6s: se algo travar, o site aparece de qualquer jeito.

Para trocar a logo da abertura, substitua os shapes dentro de `#introShapes`
pelos do novo SVG (só as tags `<path>`/`<rect>`/`<polygon>`, sem `class`) e
ajuste o `viewBox` do `.intro__logo`.

## Tipografia

Tudo em **Poppins** (400/500/600/700), carregada do Google Fonts.

No `:root` existem duas variáveis apontando para a mesma família:

- `--ff` — texto corrido e títulos
- `--fm` — rótulos técnicos (BPM, `CH 01`, legendas): mesma fonte, diferenciada só
  por caixa alta, corpo menor e `letter-spacing` largo

Ficaram separadas de propósito: se um dia você quiser voltar a ter uma segunda
fonte nos rótulos, basta trocar o valor de `--fm` — nenhuma outra linha muda.

Onde há número que muda sozinho (BPM, contadores, % do loader) está aplicado
`font-variant-numeric: tabular-nums`, senão os dígitos "dançam" ao trocar de valor.
