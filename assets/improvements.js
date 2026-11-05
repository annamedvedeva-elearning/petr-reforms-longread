/* Local-only enhancements. No answer text is transmitted or logged. */
(() => {
  document.querySelectorAll('.answer-toggle').forEach(summary => {
    const details = summary.parentElement;
    const update = () => { summary.textContent = details.open ? 'Скрыть ориентир ответа' : 'Показать ориентир ответа'; };
    details.addEventListener('toggle', update);
    update();
  });

  const form = document.getElementById('chain-form');
  if (form) {
    const target = document.getElementById('selected-chain');
    const render = () => {
      target.replaceChildren();
      const heading = document.createElement('div');
      heading.textContent = 'Ваша цепочка';
      target.append(heading);
      const list = document.createElement('ol');
      [['need', 'Потребность'], ['reform', 'Преобразование'], ['result', 'Последствие']].forEach(([name, title]) => {
        const input = form.querySelector(`input[name="${name}"]:checked`);
        const item = document.createElement('li');
        const label = document.createElement('small');
        label.textContent = title;
        item.append(label, document.createTextNode(input ? input.nextElementSibling.textContent : 'Выберите карточку'));
        list.append(item);
      });
      target.append(list);
    };
    form.addEventListener('change', render);
    form.addEventListener('reset', () => queueMicrotask(render));
    render();
  }

  const select = document.getElementById('reform-select');
  if (!select) return;
  const state = document.getElementById('answer-state');
  const other = document.getElementById('answer-other');
  const note = document.getElementById('draft-note');
  const status = document.getElementById('draft-status');
  const copyStatus = document.getElementById('copy-status');
  const ids = ['poll-tax', 'table-of-ranks', 'single-inheritance'];
  const memory = new Map();
  let current = select.value;
  let announceTimer;
  const key = value => `petr-longread:perspectives:v1:${ids[Number(value)]}`;
  const unavailable = () => {
    note.textContent = 'Сохранение в браузере недоступно. Пока страница открыта, ответы сохраняются при переключении реформ. Скопируйте ответ перед выходом: после перезагрузки он может исчезнуть.';
  };
  const save = () => {
    const draft = { state: state.value, other: other.value };
    memory.set(current, draft);
    try {
      localStorage.setItem(key(current), JSON.stringify(draft));
      clearTimeout(announceTimer);
      announceTimer = setTimeout(() => { status.textContent = 'Черновик сохранён на этом устройстве.'; }, 600);
    } catch (_) { clearTimeout(announceTimer); status.textContent = 'Черновик доступен только до закрытия страницы.'; unavailable(); }
  };
  const restore = () => {
    let draft = memory.get(current);
    if (!draft) {
      try {
        const raw = localStorage.getItem(key(current));
        draft = raw ? JSON.parse(raw) : null;
        if (draft && (typeof draft.state !== 'string' || typeof draft.other !== 'string')) draft = null;
      } catch (_) { unavailable(); }
    }
    state.value = draft?.state || '';
    other.value = draft?.other || '';
    status.textContent = draft ? 'Черновик восстановлен.' : '';
    copyStatus.textContent = '';
  };
  [state, other].forEach(field => field.addEventListener('input', save));
  select.addEventListener('change', () => {
    save();
    clearTimeout(announceTimer);
    current = select.value;
    restore();
  });
  // Detect blocked storage before the first answer is entered.
  try { const probe = 'petr-longread:storage-check'; localStorage.setItem(probe, '1'); localStorage.removeItem(probe); } catch (_) { unavailable(); }
  restore();

  document.getElementById('copy-answer').addEventListener('click', async () => {
    const text = `${select.selectedOptions[0].textContent}\n\nДля государства\n${state.value}\n\n${document.getElementById('answer-other-label').textContent}\n${other.value}`;
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch (_) {
      // Fallback for local file previews and browsers without Clipboard API.
      const buffer = document.createElement('textarea');
      buffer.value = text;
      buffer.setAttribute('aria-label', 'Текст для копирования');
      buffer.style.cssText = 'position:fixed;top:0;left:0;opacity:0;width:1px;height:1px';
      document.body.append(buffer);
      const active = document.activeElement;
      buffer.select();
      try { copied = document.execCommand('copy'); } catch (_) { /* Show manual instructions below. */ }
      buffer.remove();
      active?.focus();
    }
    copyStatus.textContent = copied ? 'Ответ скопирован.' : 'Не удалось скопировать автоматически. Выделите текст в каждом поле и скопируйте его вручную.';
  });
})();

