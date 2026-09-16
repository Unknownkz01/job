const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
  mobileMenu.hidden = open;
});

const content = window.SITE_CONTENT;
document.querySelectorAll('[data-brand-name]').forEach((element) => { element.textContent = content.brandName; });
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const twoDigits = (index) => String(index + 1).padStart(2, '0');

document.querySelector('[data-projects]').innerHTML = content.projects.map((project) => `
  <article class="project-card reveal">
    <div class="project-visual" role="img" aria-label="${escapeHtml(project.visualLabel)}">
      <div class="project-visual-top"><span>CASE / ${escapeHtml(project.index)}</span><span>MEDIA SLOT</span></div>
      <div class="project-monogram">${escapeHtml(project.visual)}</div>
      <div class="project-visual-bottom"><span>SCREENSHOT READY</span><span>16:10</span></div>
    </div>
    <div class="project-content">
      <div class="project-meta"><span>${escapeHtml(project.name)}</span><span>${escapeHtml(project.type)}</span><span class="status">${escapeHtml(project.status)}</span></div>
      <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
      <ul class="feature-list">${project.features.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      ${project.note ? `<p class="project-note">${escapeHtml(project.note)}</p>` : ''}
      <a class="project-link" href="${escapeHtml(project.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.cta)} <span aria-hidden="true">↗</span></a>
    </div>
  </article>`).join('');

document.querySelector('[data-services]').innerHTML = content.services.map(([title, description], index) => `<article class="service-card reveal"><span class="service-index">${twoDigits(index)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></article>`).join('');
document.querySelector('[data-team]').innerHTML = content.team.map((member) => `<article class="team-card reveal"><div class="portrait-placeholder" role="img" aria-label="Место для будущей фотографии ${escapeHtml(member.name)}"><span>Portrait placeholder / approved photo only</span></div><div class="team-copy"><h3>${escapeHtml(member.name)}</h3><p class="role">${escapeHtml(member.role)}</p><p>${escapeHtml(member.description)}</p><p class="tag">${escapeHtml(member.tag)}</p></div></article>`).join('');
document.querySelector('[data-process]').innerHTML = content.process.map(([title, description], index) => `<li class="process-item reveal"><span class="number">${twoDigits(index)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></li>`).join('');
document.querySelector('[data-pricing]').innerHTML = content.pricing.map(([title, price]) => `<div class="price-row"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(price)}</span></div>`).join('');
document.querySelector('[data-why]').innerHTML = content.why.map(([title, description], index) => `<article class="why-card reveal"><span class="why-index">${twoDigits(index)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></article>`).join('');

const whatsappLink = document.querySelector('[data-whatsapp]');
const whatsappNumber = (window.CONTACT_CONFIG.whatsappNumber || '').replace(/\D/g, '');
if (whatsappNumber) {
  whatsappLink.href = `https://wa.me/${whatsappNumber}`;
  whatsappLink.target = '_blank';
  whatsappLink.rel = 'noopener noreferrer';
  whatsappLink.removeAttribute('aria-disabled');
} else {
  whatsappLink.addEventListener('click', (event) => event.preventDefault());
}

const form = document.querySelector('#project-form');
const formStatus = form.querySelector('.form-status');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  form.querySelectorAll('.has-error').forEach((field) => field.classList.remove('has-error'));
  const missing = [...form.querySelectorAll('[required]')].filter((field) => !field.value.trim());
  missing.forEach((field) => field.closest('.field').classList.add('has-error'));
  if (missing.length) { formStatus.textContent = 'Заполните обязательные поля.'; missing[0].focus(); return; }
  const endpoint = window.CONTACT_CONFIG.formEndpoint;
  if (!endpoint) { formStatus.textContent = 'Форма заполнена. Добавьте API endpoint в config/contact.js для отправки заявки.'; return; }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true; formStatus.textContent = 'Отправляем…';
  try {
    const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
    if (!response.ok) throw new Error('Request failed');
    form.reset(); formStatus.textContent = 'Спасибо. Заявка отправлена.';
  } catch { formStatus.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз позже.'; }
  finally { button.disabled = false; }
});

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), {threshold:.12});
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else { document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible')); }
mobileMenu?.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    mobileMenu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
  }
});
