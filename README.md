# Painel de Indicadores JRS/HNRe

Painel web estático para monitoramento de indicadores assistenciais e de gestão do JRS/HNRe.

## Publicação (GitHub Pages)

O painel é um único arquivo `index.html` (autossuficiente, usa apenas Chart.js via CDN) e
pode ser publicado diretamente pelo GitHub Pages.

Para habilitar o Pages:

1. No repositório: **Settings → Pages**.
2. Em **Build and deployment → Source**, selecione **Deploy from a branch**.
3. Escolha o branch `main` e a pasta `/ (root)`, e clique em **Save**.
4. Após alguns instantes, o painel ficará disponível em
   `https://mauriston.github.io/jrsindicadores/`.

Alternativamente, via `gh` CLI (na sua máquina local, com o CLI autenticado):

```bash
gh api -X POST repos/Mauriston/jrsindicadores/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

## Editando os indicadores

Os dados exibidos são **dados de exemplo**. Para usar valores reais, edite o objeto
`DADOS` no `<script>` do arquivo `index.html`.

## Desenvolvimento local

Basta abrir `index.html` no navegador, ou servir a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```
