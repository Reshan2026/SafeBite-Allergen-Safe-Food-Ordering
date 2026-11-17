'use strict';
/* SafeBite – allergen engine, warnings, profile, menu and customization pages */

/* Core rule: the engine only says "green" when verified data exists and nothing matches. Missing data is never safe. */
function evaluate(item, o = {}) {
  const prof = SB.get('profile', null);
  const removed = o.removed || [];
  const tops = (o.toppings || []).map(id => TOPPINGS.find(t => t.id === id)).filter(Boolean);
  const res = { level: 'green', hits: [], maybe: [], reasons: [], unverified: !item.verified, modified: removed.length > 0, removedHits: [] };
  const remaining = item.ing.filter(i => !removed.includes(i.n));
  const contains = new Set([...remaining.map(i => i.a), ...tops.map(t => t.a)].filter(Boolean));
  res.all = [...contains];
  if (prof === null) { res.level = 'unset'; res.reasons.push('Set your allergy profile to get personal safety checks.'); return res; }
  res.hits = [...contains].filter(a => prof.includes(a));
  res.maybe = item.may.filter(a => prof.includes(a) && !res.hits.includes(a));
  res.removedHits = [...new Set(item.ing.filter(i => removed.includes(i.n) && i.a && prof.includes(i.a)).map(i => i.a))].filter(a => !contains.has(a));
  if (res.hits.length) {
    res.level = 'red';
    res.reasons.push(`This food contains ${aList(res.hits).toLowerCase()}, which matches your allergy profile.`);
    return res;
  }
  if (res.removedHits.length) res.reasons.push(`You removed an ingredient with ${aList(res.removedHits).toLowerCase()}. The kitchen cannot confirm the dish is free of traces, so we do not mark it safe.`);
  else if (res.modified) res.reasons.push('Ingredient changes are not verified by the restaurant.');
  if (res.maybe.length) res.reasons.push(`May contain ${aList(res.maybe).toLowerCase()} from shared equipment (cross-contamination).`);
  if (res.unverified) res.reasons.push('Allergen information unavailable. The restaurant has not confirmed what is in this dish.');
  if (res.reasons.length) res.level = 'yellow';
  return res;
}

const LEVEL = { green: '✔', yellow: '⚠', red: '⛔', unset: 'ℹ' };
function badgeText(r) {
  if (r.level === 'red') return `Danger: contains ${aList(r.hits).toLowerCase()}`;
  if (r.level === 'green') return 'Safe based on available information';
  if (r.level === 'unset') return 'Allergy profile not set';
  if (r.unverified) return 'Caution: allergen information unavailable';
  if (r.maybe.length) return `Caution: may contain ${aList(r.maybe).toLowerCase()}`;
  return 'Caution: change not verified';
}
const badge = r => `<span class="badge b-${r.level}"><span aria-hidden="true">${LEVEL[r.level]}</span> ${badgeText(r)}</span>`;
const detail = r => r.level === 'green'
  ? '<p class="detail d-green">Based on the verified ingredient list. Always confirm with the restaurant if your allergy is severe.</p>'
  : r.reasons.map(t => `<p class="detail d-${r.level}">${t}</p>`).join('');

/* ---------- Dialog (only for danger and caution) ---------- */
function dlg(html) {
  let d = SB.q('#sb-dialog');
  if (!d) { d = document.createElement('dialog'); d.id = 'sb-dialog'; document.body.appendChild(d); }
  d.innerHTML = html; d.showModal(); return d;
}
function showDanger(item, res, onRemove) {
  const d = dlg(`<div class="dlg dlg-red" role="alertdialog" aria-labelledby="dt"><h2 id="dt">⛔ ALLERGEN ALERT!</h2>
    <p class="big">This food contains ${aList(res.hits).toLowerCase()}, which matches your allergy profile.</p>
    <dl><dt>Allergen detected</dt><dd>${aList(res.hits)}</dd><dt>Food item</dt><dd>${SB.esc(item.name)}</dd></dl>
    <p>To keep you safe, this item cannot be added to your cart or ordered.</p>
    <div class="actions"><button class="btn btn-red" id="dl-remove">Remove Item</button><a class="btn btn-outline" href="${altLink(item)}">Find Safer Alternatives</a></div></div>`);
  SB.q('#dl-remove').focus();
  SB.q('#dl-remove').addEventListener('click', () => { d.close(); if (onRemove) onRemove(); });
}
function showCaution(item, res, onAdd) {
  const r = rById(item.r);
  const d = dlg(`<div class="dlg dlg-yellow" role="alertdialog" aria-labelledby="dt"><h2 id="dt">⚠ Please review before adding</h2>
    <p class="big">${SB.esc(item.name)} is not confirmed safe for you.</p>${detail(res)}
    <p class="muted">Cross-contamination means a small amount of an allergen can reach food through shared tools, oil or surfaces. This is not a confirmed ingredient.</p>
    <p><a href="tel:${r.phone.replace(/\s/g, '')}">📞 Contact ${r.name} (${r.phone})</a></p>
    <div class="actions"><button class="btn" id="dl-add">I reviewed this, add to cart</button><a class="btn btn-outline" href="${altLink(item)}">Find safer alternatives</a><button class="btn btn-ghost" id="dl-cancel">Cancel</button></div></div>`);
  SB.q('#dl-cancel').focus();
  SB.q('#dl-cancel').addEventListener('click', () => d.close());
  SB.q('#dl-add').addEventListener('click', () => { d.close(); onAdd(); });
}
const altLink = item => `menu.html?safe=1&cat=${encodeURIComponent(item.cat)}&from=${item.id}`;

/* Gate used everywhere an item is added */
function tryAdd(item, opt = {}, qty = 1) {
  const res = evaluate(item, opt);
  if (res.level === 'red') return showDanger(item, res);
  if (res.level === 'yellow') return showCaution(item, res, () => addToCart(item, opt, qty, true));
  addToCart(item, opt, qty, false);
  if (res.level === 'unset') SB.toast('Added. Tip: set your allergy profile for personal safety checks.');
}

/* ---------- Food card ---------- */
function foodCard(item, showRest) {
  const res = evaluate(item), r = rById(item.r);
  const chips = item.ing.map(i => `<span class="chip ${i.a && res.hits.includes(i.a) ? 'hit' : ''}">${i.a && res.hits.includes(i.a) ? '⛔ ' : ''}${i.n}</span>`).join('');
  const all = [...new Set(item.ing.map(i => i.a).filter(Boolean))];
  const info = !item.verified ? '<p class="allergen-line unk">❓ Allergen information unavailable</p>'
    : `<p class="allergen-line"><strong>Contains:</strong> ${all.length ? aList(all) : 'none listed'}</p>${item.may.length ? `<p class="allergen-line may"><strong>May contain:</strong> ${aList(item.may)}</p>` : ''}`;
  return `<article class="card fcard lv-${res.level}"><img src="${item.img}" alt="${SB.esc(item.name)}" loading="lazy" onerror="SB.imgFail(this)">
    <div class="card-b">${badge(res)}<h3>${item.name}</h3>${showRest ? `<p class="muted small">${r.name}</p>` : ''}<p>${item.desc}</p>
    ${info}<details><summary>Ingredients${item.verified ? '' : ' (unverified)'}</summary><div class="chips">${chips}</div></details>
    <div class="row"><strong class="price">${SB.money(item.price)}</strong><span class="muted small">${item.veg ? (item.vegan ? '🌱 Vegan' : '🥬 Vegetarian') : ''}</span></div>
    <div class="row"><button class="btn" data-add="${item.id}">Add to Cart</button><a class="btn btn-outline" href="customization.html?item=${item.id}">Customize</a></div></div></article>`;
}

/* ---------- Profile page ---------- */
PAGES.profile = () => {
  const form = SB.q('#p-form'), view = SB.q('#p-view'), msg = SB.q('#p-msg');
  SB.q('#p-grid').innerHTML = ALLERGENS.map(a => `<label class="aopt"><input type="checkbox" name="al" value="${a.id}"><span class="abox"><span class="aicon" aria-hidden="true">${a.icon}</span>${a.label}</span></label>`).join('');
  const show = () => {
    const prof = SB.get('profile', null);
    SB.qa('input[name=al]').forEach(c => c.checked = !!prof && prof.includes(c.value));
    const editing = prof === null;
    form.hidden = !editing; view.hidden = editing;
    SB.q('#p-chips').innerHTML = prof && prof.length ? prof.map(a => `<span class="chip hit">${ALLERGENS.find(x => x.id === a).icon} ${aName(a)}</span>`).join('') : '<span class="muted">No allergies selected.</span>';
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const sel = SB.qa('input[name=al]:checked').map(c => c.value);
    SB.set('profile', sel);
    msg.textContent = sel.length ? `Profile saved. We will check every dish against: ${aList(sel)}.` : 'Profile saved with no allergies.';
    msg.className = 'notice ok'; show(); layout();
  });
  SB.q('#p-edit').addEventListener('click', () => { form.hidden = false; view.hidden = true; SB.q('input[name=al]').focus(); });
  SB.q('#p-clear').addEventListener('click', () => {
    if (!confirm('Clear your allergy profile? Safety checks will stop until you set it again.')) return;
    SB.del('profile'); msg.textContent = 'Profile cleared.'; msg.className = 'notice warn'; show(); layout();
  });
  show();
};

/* ---------- Menu page ---------- */
PAGES.menu = () => {
  const st = { q: SB.param('q') || '', cat: SB.param('cat') || '', r: SB.param('r') || '', safe: SB.param('safe') === '1' };
  const cats = [...new Set(ITEMS.map(i => i.cat))];
  SB.q('#m-q').value = st.q; SB.q('#m-safe').checked = st.safe;
  SB.q('#m-r').innerHTML += RESTAURANTS.map(r => `<option value="${r.id}">${r.name}</option>`).join(''); SB.q('#m-r').value = st.r;
  const renderChips = () => SB.q('#m-cats').innerHTML = ['', ...cats].map(c => `<button class="catbtn" aria-pressed="${st.cat === c}" data-c="${c}">${c || 'All'}</button>`).join('');
  const render = () => {
    const q = st.q.toLowerCase();
    const list = ITEMS.filter(i => (!st.r || i.r === +st.r) && (!st.cat || i.cat === st.cat) && (!q || (i.name + i.desc + i.cat + rById(i.r).name).toLowerCase().includes(q)) && (!st.safe || evaluate(i).level === 'green'));
    const r = st.r && rById(st.r);
    SB.q('#m-title').textContent = r ? `${r.name} menu` : 'Food menu';
    SB.q('#m-sub').textContent = r ? r.safety : 'Every dish is checked against your allergy profile.';
    SB.q('#m-count').textContent = `${list.length} dish${list.length === 1 ? '' : 'es'} shown`;
    SB.q('#m-grid').innerHTML = list.length ? list.map(i => foodCard(i, !st.r)).join('') : '<p class="empty">No dishes match. Try another category or turn off “safe only”.</p>';
    renderChips();
  };
  SB.q('#m-q').addEventListener('input', e => { st.q = e.target.value; render(); });
  SB.q('#m-r').addEventListener('change', e => { st.r = e.target.value; render(); });
  SB.q('#m-safe').addEventListener('change', e => { st.safe = e.target.checked; render(); });
  SB.q('#m-cats').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { st.cat = b.dataset.c; render(); SB.q(`[data-c="${st.cat}"]`).focus(); } });
  SB.q('#m-grid').addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (b) tryAdd(iById(b.dataset.add)); });
  if (SB.param('from')) SB.q('#m-note').textContent = `Showing safer options similar to ${iById(SB.param('from')).name}.`;
  if (SB.get('profile', null) === null) SB.q('#m-banner').hidden = false;
  render();
};

/* ---------- Customization page ---------- */
PAGES.customize = () => {
  const item = iById(SB.param('item'));
  if (!item) { location.href = 'menu.html'; return; }
  const r = rById(item.r);
  SB.q('#c-main').innerHTML = `<div class="split"><div><img class="hero-img" src="${item.img}" alt="${SB.esc(item.name)}" onerror="SB.imgFail(this)"></div>
  <form id="c-form" class="stack"><h1>${item.name}</h1><p class="muted">${r.name} · ${item.desc}</p><div id="c-status" aria-live="polite"></div>
   <fieldset><legend>Remove ingredients</legend>${item.ing.map((i, k) => `<label class="check"><input type="checkbox" name="rm" value="${SB.esc(i.n)}"> Remove ${i.n}</label>`).join('')}</fieldset>
   <fieldset><legend>Toppings</legend>${TOPPINGS.map(t => `<label class="check"><input type="checkbox" name="tp" value="${t.id}"> ${t.n} (+${SB.money(t.p)})</label>`).join('')}</fieldset>
   <fieldset><legend>Portion size</legend><label class="check"><input type="radio" name="sz" value="Regular" checked> Regular</label><label class="check"><input type="radio" name="sz" value="Large"> Large (+30%)</label></fieldset>
   <label class="field">Special instructions<textarea name="note" rows="3" placeholder="For example: less spicy"></textarea></label>
   <p class="notice warn">Removing an ingredient does not make a dish safe. Kitchens share tools and surfaces. Notes are not a guarantee for allergies, so contact the restaurant if you are unsure.</p>
   <div class="row"><label class="field qty">Quantity<input type="number" name="qty" min="1" max="10" value="1"></label><strong class="price" id="c-price"></strong></div>
   <button class="btn btn-lg" type="submit">Add to Cart</button></form></div>`;
  const form = SB.q('#c-form');
  const read = () => ({ removed: SB.qa('[name=rm]:checked', form).map(c => c.value), toppings: SB.qa('[name=tp]:checked', form).map(c => c.value), size: form.sz.value, note: form.note.value.trim() });
  const upd = () => {
    const o = read(), res = evaluate(item, o);
    SB.q('#c-status').innerHTML = badge(res) + detail(res);
    SB.q('#c-price').textContent = SB.money(unitPrice(item, o) * (+form.qty.value || 1));
  };
  form.addEventListener('input', upd);
  form.addEventListener('submit', e => { e.preventDefault(); tryAdd(item, read(), Math.max(1, Math.min(10, +form.qty.value || 1))); });
  upd();
};
