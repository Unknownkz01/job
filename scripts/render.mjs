import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';

const page = new URL('../dist/index.html', import.meta.url);
let html = await readFile(page, 'utf8');
function render(attribute, markup) {
  const pattern = new RegExp(`(<(?:div|ol)[^>]* ${attribute}>)[\\s\\S]*?(<!-- /${attribute} -->)(</(?:div|ol)>)`);
  if (!pattern.test(html)) throw new Error(`Missing section: ${attribute}`);
  html = html.replace(pattern, (_, opening, marker, closing) => `${opening}\n${markup}\n${marker}${closing}`);
}
const context = { window: {} };
vm.runInNewContext(await readFile(new URL('../dist/config/content.js', import.meta.url), 'utf8'), context);
const content = context.window.SITE_CONTENT;
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const twoDigits = (index) => String(index + 1).padStart(2, '0');

render('data-projects', content.projects.map((project) => `
  <article class="project-card reveal">
    <div class="project-visual">
      <div class="project-visual-top"><span>CASE / ${escapeHtml(project.index)}</span><span>${escapeHtml(project.name)}</span></div>
      <img class="project-preview" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt)}" width="1600" height="1024" loading="lazy">
      <div class="project-visual-bottom"><span>${escapeHtml(project.type)}</span><span>GK / DEV</span></div>
    </div>
    <div class="project-content">
      <div class="project-meta"><span>${escapeHtml(project.name)}</span><span>${escapeHtml(project.type)}</span><span class="status">${escapeHtml(project.status)}</span></div>
      <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
      <ul class="feature-list">${project.features.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      ${project.note ? `<p class="project-note">${escapeHtml(project.note)}</p>` : ''}
      <a class="project-link" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.cta)} <span aria-hidden="true">↗</span></a>
    </div>
  </article>`).join(''));

render('data-services', content.services.map(([title, description], index) => `<article class="service-card reveal"><span class="service-index">${twoDigits(index)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></article>`).join(''));
render('data-team', content.team.map((member) => `<article class="team-card reveal"><div class="team-portrait"><img src="${escapeHtml(member.image)}" alt="${escapeHtml(member.imageAlt)}" width="1024" height="1536"></div><div class="team-copy"><h3>${escapeHtml(member.name)}</h3><p class="role">${escapeHtml(member.role)}</p><p>${escapeHtml(member.description)}</p><p class="tag">${escapeHtml(member.tag)}</p></div></article>`).join(''));
render('data-process', content.process.map(([title, description], index) => `<li class="process-item reveal"><span class="number">${twoDigits(index)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></li>`).join(''));
render('data-pricing', content.pricing.map(([title, price]) => `<div class="price-row"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(price)}</span></div>`).join(''));
render('data-why', content.why.map(([title, description], index) => `<article class="why-card reveal"><span class="why-index">${twoDigits(index)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></article>`).join(''));

html = html.replace(/(<span data-brand-name>)[^<]*(<\/span>)/g, (_, opening, closing) => `${opening}${escapeHtml(content.brandName)}${closing}`);
await writeFile(page, html.replace(/[\t ]+$/gm, ''));
