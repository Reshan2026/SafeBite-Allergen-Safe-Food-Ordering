'use strict';
/* SafeBite – cart logic and cart page */
const SIZES = { Regular: 1, Large: 1.3 };
const DELIVERY_FEE = 39;
const cartGet = () => SB.get('cart', []);
const cartSet = c => { SB.set('cart', c); updateBadge(); };
function updateBadge() { const el = SB.q('#cart-count'); if (el) el.textContent = cartGet().reduce((s, l) => s + l.qty, 0); }
function unitPrice(item, l) {
  const t = (l.toppings || []).reduce((s, id) => s + ((TOPPINGS.find(x => x.id === id) || {}).p || 0), 0);
  return Math.round((item.price + t) * SIZES[l.size || 'Regular']);
}
function addToCart(item, opt, qty, ack) {
  const c = cartGet();
  const line = { uid: Date.now() + Math.random().toString(36).slice(2, 6), id: item.id, qty, removed: opt.removed || [], toppings: opt.toppings || [], size: opt.size || 'Regular', note: opt.note || '', ack: !!ack };
  const key = l => JSON.stringify([l.id, l.removed, l.toppings, l.size, l.note]);
  const ex = c.find(l => key(l) === key(line));
  if (ex) { ex.qty = Math.min(10, ex.qty + qty); ex.ack = ex.ack || line.ack; } else c.push(line);
  cartSet(c); SB.toast(`${item.name} added to cart`);
}
const removeLine = uid => cartSet(cartGet().filter(l => l.uid !== uid));
function cartView() {
  const lines = cartGet().map(l => { const item = iById(l.id); return { l, item, res: evaluate(item, l), unit: unitPrice(item, l) }; });
  const sub = lines.reduce((s, x) => s + x.unit * x.l.qty, 0);
  return { lines, sub, fee: lines.length ? DELIVERY_FEE : 0, total: sub + (lines.length ? DELIVERY_FEE : 0), blocked: lines.filter(x => x.res.level === 'red'), review: lines.filter(x => x.res.level === 'yellow' || x.res.level === 'unset') };
}
function variantText(l) {
  const p = [];
  if (l.size === 'Large') p.push('Large');
  if (l.removed.length) p.push('No ' + l.removed.join(', '));
  if (l.toppings.length) p.push('+ ' + l.toppings.map(id => TOPPINGS.find(t => t.id === id).n).join(', '));
  if (l.note) p.push('Note: ' + SB.esc(l.note));
  return p.join(' · ');
}

PAGES.cart = () => {
  const render = () => {
    const v = cartView();
    SB.q('#cart-empty').hidden = v.lines.length > 0; SB.q('#cart-body').hidden = !v.lines.length;
    SB.q('#cart-alert').innerHTML = v.blocked.length ? `<div class="notice danger" role="alert"><strong>⛔ ALLERGEN ALERT!</strong> ${v.blocked.map(x => `<p>${SB.esc(x.item.name)} ${x.res.reasons[0].replace('This food contains', 'contains')}</p>`).join('')}<p>Remove these items to continue to checkout.</p></div>` : '';
    SB.q('#cart-lines').innerHTML = v.lines.map(({ l, item, res, unit }) => `<article class="card cline lv-${res.level}"><img src="${item.img}" alt="" onerror="SB.imgFail(this)">
      <div class="cline-b"><h3>${item.name}</h3><p class="muted small">${rById(item.r).name}${variantText(l) ? ' · ' + variantText(l) : ''}</p>${badge(res)}${res.level !== 'green' ? detail(res) : ''}
      <div class="row"><div class="stepper" role="group" aria-label="Quantity for ${SB.esc(item.name)}"><button data-dec="${l.uid}" aria-label="Decrease quantity">−</button><output>${l.qty}</output><button data-inc="${l.uid}" aria-label="Increase quantity">+</button></div>
      <strong class="price">${SB.money(unit * l.qty)}</strong><button class="btn btn-ghost btn-sm" data-rm="${l.uid}">Remove Item</button></div>
      ${res.level === 'red' ? `<a class="btn btn-outline btn-sm" href="${altLink(item)}">Find Safer Alternatives</a>` : ''}</div></article>`).join('');
    SB.q('#s-sub').textContent = SB.money(v.sub); SB.q('#s-fee').textContent = SB.money(v.fee); SB.q('#s-total').textContent = SB.money(v.total);
    const go = SB.q('#go-checkout'); go.setAttribute('aria-disabled', v.blocked.length ? 'true' : 'false'); go.classList.toggle('disabled', !!v.blocked.length);
    SB.q('#s-note').textContent = v.blocked.length ? 'Checkout is blocked until dangerous items are removed.' : v.review.length ? `${v.review.length} item${v.review.length > 1 ? 's need' : ' needs'} review at checkout.` : 'All items passed the safety check.';
  };
  SB.q('#cart-lines').addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t) return;
    const c = cartGet(), by = u => c.find(l => l.uid === u);
    if (t.dataset.rm) removeLine(t.dataset.rm);
    else if (t.dataset.inc) { const l = by(t.dataset.inc); l.qty = Math.min(10, l.qty + 1); cartSet(c); }
    else if (t.dataset.dec) { const l = by(t.dataset.dec); if (l.qty > 1) { l.qty--; cartSet(c); } else removeLine(l.uid); }
    render();
  });
  SB.q('#go-checkout').addEventListener('click', e => { if (e.currentTarget.getAttribute('aria-disabled') === 'true') { e.preventDefault(); SB.toast('Remove the dangerous items first.'); } });
  SB.q('#clear-cart').addEventListener('click', () => { cartSet([]); render(); });
  render();
};
