const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function setMenu(open, restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileMenu.hidden = !open;
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => setMenu(mobileMenu.hidden));
mobileMenu.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileMenu.hidden) setMenu(false, true);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
window.matchMedia('(min-width: 1051px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});

const config = window.CONTACT_CONFIG || {};
const whatsappNumber = String(config.whatsappNumber || '').replace(/\D/g, '');
const hasWhatsApp = /^[1-9]\d{7,14}$/.test(whatsappNumber);
const endpoint = String(config.formEndpoint || '').trim();
const whatsappLink = document.querySelector('[data-whatsapp]');
if (hasWhatsApp) {
  whatsappLink.href = `https://wa.me/${whatsappNumber}`;
  whatsappLink.target = '_blank';
  whatsappLink.rel = 'noopener noreferrer';
  whatsappLink.hidden = false;
}

const form = document.querySelector('#project-form');
const formStatus = form.querySelector('.form-status');
const button = form.querySelector('button[type="submit"]');
button.disabled = false;
const contactNote = document.querySelector('#contact-note');
button.textContent = endpoint ? 'Отправить заявку ↗' : hasWhatsApp ? 'Продолжить в WhatsApp ↗' : 'Сохранить описание ↓';
contactNote.textContent = endpoint
  ? 'Укажите контактный номер и кратко опишите задачу.'
  : hasWhatsApp
    ? 'Откроется WhatsApp с готовым текстом. Проверьте сообщение и отправьте его.'
    : 'Отправка заявок пока недоступна. Вы можете сохранить описание проекта в файл.';

function setError(field, message) {
  const wrapper = field.closest('.field');
  let error = wrapper.querySelector('.field-error');
  if (!error) {
    error = document.createElement('span');
    error.className = 'field-error';
    error.id = `${field.id}-error`;
    wrapper.append(error);
  }
  error.textContent = message;
  wrapper.classList.add('has-error');
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', error.id);
}
function clearError(field) {
  field.closest('.field')?.classList.remove('has-error');
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
  field.closest('.field')?.querySelector('.field-error')?.remove();
}
form.addEventListener('input', (event) => {
  if (event.target.matches('input, textarea')) clearError(event.target);
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (button.disabled) return;
  const fields = [...form.querySelectorAll('input, textarea')];
  fields.forEach(clearError);
  for (const field of fields) {
    if (field.required && !field.value.trim()) setError(field, 'Заполните это поле.');
  }
  const phone = form.elements.phone;
  if (phone.value.trim() && (!/^[+\d\s().-]+$/.test(phone.value) || !/^\d{8,15}$/.test(phone.value.replace(/\D/g, '')))) {
    setError(phone, 'Укажите номер с кодом страны: от 8 до 15 цифр.');
  }
  const invalid = form.querySelector('[aria-invalid="true"]');
  if (invalid) {
    formStatus.textContent = 'Проверьте отмеченные поля.';
    invalid.focus();
    return;
  }
  const data = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, value.trim()]));
  const brief = [
    'Заявка на разработку — GK Development',
    `Имя: ${data.name}`, `Компания: ${data.company || 'Не указана'}`,
    `Телефон: ${data.phone}`, `Тип продукта: ${data.product}`, `Бюджет: ${data.budget}`,
    '', 'Задача:', data.brief,
  ].join('\n');
  if (!endpoint) {
    if (hasWhatsApp) {
      const link = document.createElement('a');
      link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(brief)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      formStatus.textContent = 'Сообщение подготовлено. Отправьте его в WhatsApp.';
    } else {
      const url = URL.createObjectURL(new Blob(['\uFEFF', brief], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gk-development-project.txt';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      formStatus.textContent = 'Описание подготовлено для скачивания. Заявка не отправлена.';
    }
    return;
  }
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  formStatus.textContent = 'Отправляем заявку…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    form.reset();
    formStatus.textContent = 'Спасибо! Заявка отправлена.';
  } catch {
    formStatus.textContent = 'Не удалось подтвердить отправку. Данные сохранены в форме. Попробуйте позже.';
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
    form.removeAttribute('aria-busy');
  }
});
