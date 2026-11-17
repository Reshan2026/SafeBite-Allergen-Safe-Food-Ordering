'use strict';
/* SafeBite – checkout with final allergen check, and order confirmation */
PAGES.checkout = () => {
  const form = SB.q('#co-form'), user = SB.get('user', {});
  if (user.name) form.name.value = user.name; if (user.phone) form.phone.value = user.phone; if (user.address) form.address.value = user.address;
  const render = () => {
    const v = cartView();
    if (!v.lines.length) { SB.q('#co-wrap').hidden = true; SB.q('#co-empty').hidden = false; return v; }
    SB.q('#co-items').innerHTML = v.lines.map(({ l, item, res, unit }) => `<li class="lv-${res.level}"><div><strong>${l.qty}× ${item.name}</strong><span class="muted small">${variantText(l)}</span>${badge(res)}${res.level !== 'green' ? detail(res) : ''}
      ${res.level === 'red' ? `<button type="button" class="btn btn-red btn-sm" data-rm="${l.uid}">Remove Item</button> <a class="btn btn-outline btn-sm" href="${altLink(item)}">Find Safer Alternatives</a>` : ''}</div><span>${SB.money(unit * l.qty)}</span></li>`).join('');
    SB.q('#co-total').textContent = SB.money(v.total);
    SB.q('#co-block').innerHTML = v.blocked.length ? `<div class="notice danger" role="alert"><strong>⛔ Order blocked.</strong> ${v.blocked.length} item${v.blocked.length > 1 ? 's contain' : ' contains'} an allergen from your profile. Remove ${v.blocked.length > 1 ? 'them' : 'it'} to place your order.</div>` : '';
    SB.q('#co-review').hidden = !v.review.length;
    SB.q('#co-place').disabled = !!v.blocked.length;
    return v;
  };
  SB.q('#co-items').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { removeLine(b.dataset.rm); render(); } });
  SB.qa('[name=pay]').forEach(r => r.addEventListener('change', () => { SB.q('#card-box').hidden = form.pay.value !== 'online'; }));
  const err = (name, msg) => { const f = form[name], e = SB.q('#e-' + name); e.textContent = msg; f.setAttribute('aria-invalid', !!msg); return !msg; };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = render();                       // final allergen check, run again at the moment of ordering
    if (v.blocked.length) { SB.q('#co-block').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    let ok = true;
    ok = err('name', form.name.value.trim().length < 2 ? 'Enter your full name.' : '') && ok;
    ok = err('phone', /^[6-9]\d{9}$/.test(form.phone.value.replace(/\s/g, '')) ? '' : 'Enter a valid 10-digit mobile number.') && ok;
    ok = err('address', form.address.value.trim().length < 10 ? 'Enter your full delivery address.' : '') && ok;
    if (form.pay.value === 'online') ok = err('card', /^\d{16}$/.test(form.card.value.replace(/\s/g, '')) ? '' : 'Enter a 16-digit test card number (any digits).') && ok;
    if (v.review.length && !form.reviewed.checked) { SB.q('#e-reviewed').textContent = 'Please confirm you reviewed the caution notes.'; ok = false; } else SB.q('#e-reviewed').textContent = '';
    if (!ok) { const bad = SB.q('[aria-invalid=true]') || form.reviewed; bad.focus(); return; }
    const t = Math.max(...v.lines.map(x => rById(x.item.r).time));
    const order = {
      id: 'SB-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 90 + 10), date: new Date().toISOString(),
      items: v.lines.map(x => ({ name: x.item.name, qty: x.l.qty, price: x.unit * x.l.qty, status: x.res.level, note: variantText(x.l) })),
      total: v.total, payment: form.pay.value === 'cod' ? 'Cash on Delivery' : 'Online (mock)', eta: `${t}–${t + 10} min`, name: form.name.value.trim(), address: form.address.value.trim()
    };
    SB.set('orders', [order, ...SB.get('orders', [])]); SB.set('lastOrder', order);
    SB.set('user', { name: order.name, phone: form.phone.value.trim(), address: order.address });
    SB.del('cart'); location.href = 'confirmation.html';
  });
  render();
};

PAGES.confirmation = () => {
  const o = SB.get('lastOrder', null);
  if (!o) { SB.q('#cf-wrap').hidden = true; SB.q('#cf-empty').hidden = false; return; }
  SB.q('#cf-id').textContent = o.id; SB.q('#cf-eta').textContent = o.eta; SB.q('#cf-total').textContent = SB.money(o.total);
  SB.q('#cf-pay').textContent = o.payment; SB.q('#cf-name').textContent = `${o.name}, ${o.address}`;
  SB.q('#cf-items').innerHTML = o.items.map(i => `<li><span>${i.qty}× ${SB.esc(i.name)} ${i.note ? `<span class="muted small">(${i.note})</span>` : ''}${i.status === 'yellow' || i.status === 'unset' ? ' <span class="badge b-yellow">⚠ Reviewed caution</span>' : ''}</span><span>${SB.money(i.price)}</span></li>`).join('');
};
