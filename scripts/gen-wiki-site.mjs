// Generator: static wiki site for GitHub Pages from the committed markdown
// mirror in docs/wiki. No dependencies — plain Node.
// Run: node scripts/gen-wiki-site.mjs  (output: wiki-site/)
//
// Deploy: CI copies wiki-site/ into dist/wiki so the Pages site serves
// https://<org>.github.io/<repo>/wiki/.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, basename } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = resolve(root, 'docs/wiki');
const outDir = resolve(root, 'wiki-site');
const REPO = 'https://github.com/egilyad/ai-os-new';

if (!existsSync(docsDir)) {
    console.error('docs/wiki not found — run `npm run gen:wiki-docs` first');
    process.exit(1);
}
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(resolve(outDir, 'assets'), { recursive: true });

const HEADER_RE = /^<!--.*?-->\s*/s;

function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mapHref(url) {
    const u = url.trim();
    if (/^https?:\/\//.test(u) || u.startsWith('#') || u.startsWith('mailto:')) return u;
    if (u === '../README.md' || u === '../README_EN.md' || u === '../README_RU.md') {
        return `${REPO}/blob/main/${u.replace('../', '')}`;
    }
    if (u === './README.md' || u === 'README.md') return './index.html';
    if (u.endsWith('.md')) return `./${u.replace(/^\.\//, '').replace(/\.md$/, '.html')}`;
    return u;
}

function inline(text) {
    const escaped = escHtml(text);
    return escaped
        .split(/(`[^`]+`)/)
        .map((part, idx) => {
            if (idx % 2 === 1) return `<code>${part.slice(1, -1)}</code>`;
            return part
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) => `<a href="${mapHref(u)}">${t}</a>`)
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
        })
        .join('');
}

function isTableSep(line) {
    return /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line) && line.includes('-');
}

function splitRow(line) {
    let s = line.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map((c) => c.trim());
}

function mdToHtml(md) {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (/^```/.test(line)) {
            const lang = line.slice(3).trim();
            const buf = [];
            i++;
            while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
            i++;
            const raw = escHtml(buf.join('\n'));
            if (lang === 'mermaid') out.push(`<pre class="mermaid">${raw}</pre>`);
            else out.push(`<pre><code class="language-${lang}">${raw}</code></pre>`);
            continue;
        }
        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
            const level = heading[1].length;
            out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
            i++;
            continue;
        }
        if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
            out.push('<hr>');
            i++;
            continue;
        }
        if (/^>\s?/.test(line)) {
            const buf = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
            out.push(`<blockquote>${buf.map((b) => inline(b)).join('<br>')}</blockquote>`);
            continue;
        }
        if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            const head = splitRow(line);
            const align = splitRow(lines[i + 1]).map((c) =>
                c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : c.startsWith(':') ? 'left' : '',
            );
            i += 2;
            const rows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
            const th = head.map((c, k) => `<th${align[k] ? ` style="text-align:${align[k]}"` : ''}>${inline(c)}</th>`).join('');
            const tb = rows
                .map(
                    (r) =>
                        `<tr>${r
                            .map((c, k) => `<td${align[k] ? ` style="text-align:${align[k]}"` : ''}>${inline(c)}</td>`)
                            .join('')}</tr>`,
                )
                .join('');
            out.push(`<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>`);
            continue;
        }
        if (/^\s*- /.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*- /.test(lines[i])) items.push(lines[i++].replace(/^\s*- /, ''));
            out.push(`<ul>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`);
            continue;
        }
        if (/^\s*\d+\. /.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\. /, ''));
            out.push(`<ol>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ol>`);
            continue;
        }
        if (line.trim() === '') {
            i++;
            continue;
        }
        const buf = [];
        while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !/^(#{1,6}\s|```|>\s?|\s*- |\s*\d+\. )/.test(lines[i]) &&
            !lines[i].trim().startsWith('|') &&
            !/^\s*(-{3,}|\*{3,})\s*$/.test(lines[i])
        ) {
            buf.push(lines[i++]);
        }
        out.push(`<p>${inline(buf.join('\n'))}</p>`);
    }
    return out.join('\n');
}

// ---- load articles ----
const mdFiles = readdirSync(docsDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
const articles = [];
for (const f of mdFiles) {
    const slug = basename(f, '.md');
    let raw = readFileSync(resolve(docsDir, f), 'utf8').replace(HEADER_RE, '');
    const title = (/^#\s+(.*)$/m.exec(raw)?.[1] ?? slug).trim();
    const section = (/^>\s*Раздел:\s*\*\*(.+?)\*\*/.exec(raw)?.[1] ?? '').trim();
    const body = raw;
    articles.push({ slug, title, section, body });
}

// section order + titles from the index (docs/wiki/README.md)
const indexRaw = readFileSync(resolve(docsDir, 'README.md'), 'utf8');
const sectionOrder = [];
for (const m of indexRaw.matchAll(/^##\s+(.+?)\s+\(\d+\)\s*$/gm)) sectionOrder.push(m[1].trim());
const bySection = new Map(sectionOrder.map((s) => [s, []]));
for (const a of articles) {
    if (!bySection.has(a.section)) bySection.set(a.section, []);
    bySection.get(a.section).push(a);
}
for (const list of bySection.values()) list.sort((x, y) => x.title.localeCompare(y.title, 'ru'));

// ---- nav + page shell ----
function navHtml(activeSlug) {
    const parts = ['<nav class="nav"><a class="home" href="./index.html">Wiki SuperAgents OS</a>'];
    for (const [section, list] of bySection) {
        if (!list.length) continue;
        parts.push(`<div class="nav-section"><div class="nav-title">${escHtml(section)}</div><ul>`);
        for (const a of list) {
            const cls = a.slug === activeSlug ? ' class="active"' : '';
            parts.push(`<li><a${cls} href="./${a.slug}.html">${escHtml(a.title)}</a></li>`);
        }
        parts.push('</ul></div>');
    }
    parts.push('</nav>');
    return parts.join('');
}

function page({ title, contentHtml, activeSlug }) {
    return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escHtml(title)} — Wiki SuperAgents OS</title>
<link rel="stylesheet" href="./assets/style.css">
</head>
<body>
<header class="topbar">
  <button class="menu-toggle" aria-label="меню">≡</button>
  <a class="brand" href="./index.html">Wiki SuperAgents OS</a>
  <div class="search">
    <input id="q" type="search" placeholder="Поиск по вики…" autocomplete="off">
    <div id="results" class="results" hidden></div>
  </div>
</header>
<div class="layout">
  <aside class="sidebar" id="sidebar">${navHtml(activeSlug)}</aside>
  <main class="content">${contentHtml}</main>
</div>
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
</script>
<script src="./assets/app.js"></script>
</body>
</html>
`;
}

// ---- write article pages ----
for (const a of articles) {
    writeFileSync(
        resolve(outDir, `${a.slug}.html`),
        page({ title: a.title, contentHtml: mdToHtml(a.body), activeSlug: a.slug }),
        'utf8',
    );
}

// ---- index page (portal) ----
writeFileSync(
    resolve(outDir, 'index.html'),
    page({ title: 'Главная', contentHtml: mdToHtml(indexRaw.replace(HEADER_RE, '')), activeSlug: '__home__' }),
    'utf8',
);

// ---- search index ----
const search = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    section: a.section,
    text: a.body
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/[#>*`|_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 1500),
}));
writeFileSync(resolve(outDir, 'search-index.json'), JSON.stringify(search), 'utf8');

// ---- inert files ----
writeFileSync(resolve(outDir, '.nojekyll'), '', 'utf8');

// ---- assets ----
const CSS = `:root{--bg:#fff;--fg:#1f2933;--muted:#6b7280;--line:#e5e7eb;--accent:#2563eb;--code-bg:#f3f4f6;--nav-bg:#f8fafc}
*{box-sizing:border-box}
body{margin:0;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:var(--fg);background:var(--bg)}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.topbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--bg);border-bottom:1px solid var(--line)}
.brand{font-weight:700;color:var(--fg)}
.menu-toggle{display:none;font-size:22px;line-height:1;background:none;border:0;cursor:pointer}
.search{position:relative;margin-left:auto}
.search input{width:min(360px,60vw);padding:8px 12px;border:1px solid var(--line);border-radius:8px;font-size:15px}
.results{position:absolute;right:0;top:110%;width:min(520px,90vw);max-height:60vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12)}
.results a{display:block;padding:8px 12px;color:var(--fg);border-bottom:1px solid var(--line)}
.results a:last-child{border-bottom:0}
.results .sec{color:var(--muted);font-size:12px}
.layout{display:flex;align-items:flex-start;max-width:1200px;margin:0 auto}
.sidebar{flex:0 0 280px;position:sticky;top:57px;max-height:calc(100vh - 57px);overflow:auto;padding:16px;border-right:1px solid var(--line);background:var(--nav-bg)}
.nav .home{display:block;font-weight:700;margin-bottom:12px}
.nav-title{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:14px 0 6px}
.nav ul{list-style:none;margin:0;padding:0}
.nav li a{display:block;padding:3px 8px;border-radius:6px;color:var(--fg)}
.nav li a.active{background:var(--accent);color:#fff}
.content{flex:1 1 auto;min-width:0;padding:24px 32px 80px}
.content h1{margin-top:0}
.content h2{margin-top:1.8em;border-bottom:1px solid var(--line);padding-bottom:.2em}
.content table{border-collapse:collapse;display:block;overflow:auto;max-width:100%}
.content th,.content td{border:1px solid var(--line);padding:6px 10px;text-align:left}
.content th{background:var(--nav-bg)}
.content blockquote{margin:1em 0;padding:.4em 1em;border-left:3px solid var(--accent);background:var(--nav-bg);color:var(--muted)}
.content code{background:var(--code-bg);padding:.1em .35em;border-radius:4px;font:14px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.content pre{background:var(--code-bg);padding:14px;border-radius:8px;overflow:auto}
.content pre code{background:none;padding:0}
.content pre.mermaid{background:transparent;text-align:center}
@media(max-width:860px){
.sidebar{position:fixed;left:0;top:57px;bottom:0;width:280px;transform:translateX(-100%);transition:transform .2s;z-index:15;border-right:1px solid var(--line)}
.sidebar.open{transform:none}
.menu-toggle{display:block}
.content{padding:16px}
}
`;
writeFileSync(resolve(outDir, 'assets/style.css'), CSS, 'utf8');

const APPJS = `(function(){
  var input=document.getElementById('q');
  var box=document.getElementById('results');
  if(!input||!box)return;
  var idx=null,loading=false;
  function load(){
    if(idx||loading)return;
    loading=true;
    fetch('./search-index.json').then(function(r){return r.json()}).then(function(d){idx=d}).catch(function(){idx=[]});
  }
  function norm(s){return (s||'').toLowerCase()}
  input.addEventListener('focus',load);
  input.addEventListener('input',function(){
    var q=norm(input.value.trim());
    if(!q){box.hidden=true;box.innerHTML='';return;}
    load();
    if(!idx){box.hidden=false;box.innerHTML='<a>…</a>';return;}
    var terms=q.split(/\\s+/);
    var hits=idx.filter(function(a){
      var hay=norm(a.title+' '+a.section+' '+a.text);
      return terms.every(function(t){return hay.indexOf(t)>=0});
    }).slice(0,25);
    if(!hits.length){box.hidden=false;box.innerHTML='<a>ничего не найдено</a>';return;}
    box.hidden=false;
    box.innerHTML=hits.map(function(a){
      return '<a href="./'+a.slug+'.html"><b>'+a.title+'</b><div class="sec">'+a.section+'</div></a>';
    }).join('');
  });
  document.addEventListener('click',function(e){if(!box.contains(e.target)&&e.target!==input)box.hidden=true;});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){box.hidden=true;}
    if(e.key==='Enter'&&!box.hidden){var a=box.querySelector('a[href]');if(a)location.href=a.getAttribute('href');}
  });
  var t=document.querySelector('.menu-toggle'),sb=document.getElementById('sidebar');
  if(t&&sb)t.addEventListener('click',function(){sb.classList.toggle('open');});
})();
`;
writeFileSync(resolve(outDir, 'assets/app.js'), APPJS, 'utf8');

console.log(`wiki site: ${articles.length} articles + index -> wiki-site/`);

