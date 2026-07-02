# Painel de Indicadores e Resultados — JRS/HNRe

Dashboard estático (HTML autocontido) dos indicadores do Programa Netuno da Junta
Regular de Saúde do Hospital Naval de Recife. Lê os dados ao vivo de um Web App do
Google Apps Script; sem conexão, usa o snapshot embutido.

## Publicação no GitHub Pages

Pré-requisito: ter implantado o Web App (Apps Script) e colado a URL `/exec` em
`CONFIG.WEB_APP_URL`, no topo do `<script>` do `index.html`.

### Opção A — GitHub CLI (`gh`), em um bloco

```bash
mkdir jrsindicadores && cd jrsindicadores
# copie o index.html (e este README) para dentro desta pasta
git init -b main
git add .
git commit -m "Painel de Indicadores JRS/HNRe"
gh repo create jrsindicadores --public --source=. --remote=origin --push
# habilita o GitHub Pages na branch main (raiz):
gh api -X POST repos/{OWNER}/jrsindicadores/pages -f "source[branch]=main" -f "source[path]=/"
```

Troque `{OWNER}` pelo seu usuário/organização. Em ~1 min o site fica em:
`https://{OWNER}.github.io/jrsindicadores/`

### Opção B — pela web

1. Crie o repositório **jrsindicadores** (público).
2. Faça upload do `index.html` (e do README) na raiz.
3. **Settings › Pages › Build and deployment › Source: Deploy from a branch** →
   branch **main**, pasta **/(root)** → Save.
4. Acesse `https://{OWNER}.github.io/jrsindicadores/`.

## Atualização dos dados

- O painel relê a planilha ao carregar, ao focar a aba, a cada 2 min e no botão ↻.
- Para trocar a fonte, edite `CONFIG.WEB_APP_URL` no `index.html` e faça novo commit.

## Observações

- O fetch anônimo do Web App funciona bem servido em **https** (Pages). Em `file://`
  local alguns navegadores bloqueiam a chamada e o painel cai no snapshot.
- O Web App expõe apenas números agregados (contagens, %, finalidades).
