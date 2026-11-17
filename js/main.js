'use strict';
/* SafeBite – shared helpers, data, layout and simple pages */
const SB = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('sb_' + k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('sb_' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('sb_' + k); } catch (e) {} },
  money: n => '₹' + Math.round(n),
  q: (s, r = document) => r.querySelector(s),
  qa: (s, r = document) => [...r.querySelectorAll(s)],
  param: k => new URLSearchParams(location.search).get(k),
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  toast(msg) {
    let t = SB.q('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(SB._t); SB._t = setTimeout(() => t.classList.remove('show'), 2800);
  },
  imgFail(img) {
    img.onerror = null;
    img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#e8f5ec"/><text x="400" y="330" font-size="120" text-anchor="middle">🍽️</text></svg>');
  }
};

const PAGES = {};

const ALLERGENS = [
  { id: 'peanuts', label: 'Peanuts', icon: '🥜' }, { id: 'treenuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'milk', label: 'Milk/Dairy', icon: '🥛' }, { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🫘' }, { id: 'wheat', label: 'Wheat/Gluten', icon: '🌾' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' }, { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'sesame', label: 'Sesame', icon: '⚪' }
];
const aName = id => (ALLERGENS.find(a => a.id === id) || { label: id }).label;
const aList = ids => ids.map(aName).join(', ');

const U = id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;
const RS = (id, name, cuisine, rating, time, img, phone, safety) => ({ id, name, cuisine, rating, time, img: U(img), phone, safety });
const RESTAURANTS = [
  RS(1, 'Green Fork Kitchen', 'Healthy', 4.7, 25, '1512621776951-a57141f2eefd', '+91 98450 10001', 'Allergen sheet reviewed monthly. Separate prep area for nut dishes.'),
  RS(2, 'Napoli Oven', 'Italian', 4.5, 35, '1513104890138-7c749659a591', '+91 98450 10002', 'Full allergen matrix. Shared ovens and flour, so traces of wheat are possible.'),
  RS(3, 'Tokyo Table', 'Japanese', 4.6, 40, '1579871494447-9811cf80d66c', '+91 98450 10003', 'Fish and shellfish handled on shared boards. Some dishes have no allergen data yet.'),
  RS(4, 'Spice Route', 'Indian', 4.8, 30, '1585937421612-70a008356fbe', '+91 98450 10004', 'Ingredients verified by head chef. Tree nuts are used in many gravies.'),
  RS(5, 'Burger Barn', 'American', 4.3, 20, '1568901346375-23c9450c58cd', '+91 98450 10005', 'Shared fryer for all items. Some menu data is still being collected.'),
  RS(6, 'Casa Taco', 'Mexican', 4.4, 30, '1565299585323-38d6b0865b47', '+91 98450 10006', 'Corn-based kitchen. Shellfish prepared on a separate grill.')
];

/* Ingredient format: 'Name|allergenId'. "may" = possible cross-contamination. verified=false -> allergen info unavailable */
const F = (id, r, name, cat, price, img, desc, ing, may, flags, verified = true) => ({
  id, r, name, cat, price, img: U(img), desc, may, verified,
  ing: ing.map(s => { const [n, a] = s.split('|'); return { n, a: a || null }; }),
  veg: /[vV]/.test(flags), vegan: /V/.test(flags)
});
const ITEMS = [
  F(1, 1, 'Garden Quinoa Bowl', 'Salads', 280, '1546069901-ba9599a7e63c', 'Quinoa, kale, avocado and chickpeas with a lemon-herb dressing.', ['Quinoa', 'Kale', 'Avocado', 'Chickpeas', 'Lemon dressing'], ['sesame'], 'V'),
  F(2, 1, 'Peanut Butter Sandwich', 'Sandwiches', 190, '1528735602780-2552fd46c7af', 'Toasted wholewheat bread with creamy peanut butter and banana.', ['Wholewheat bread|wheat', 'Peanut butter|peanuts', 'Banana', 'Honey'], [], 'v'),
  F(3, 1, 'Berry Almond Pancakes', 'Breakfast', 260, '1567620905732-2d1ec7ab7445', 'Fluffy pancakes with mixed berries, almond flakes and maple syrup.', ['Wheat flour|wheat', 'Milk|milk', 'Eggs|eggs', 'Almonds|treenuts', 'Berries', 'Maple syrup'], [], 'v'),
  F(4, 2, 'Margherita Pizza', 'Pizza', 349, '1513104890138-7c749659a591', 'Wood-fired pizza with tomato, mozzarella and fresh basil.', ['Pizza dough|wheat', 'Mozzarella|milk', 'Tomato sauce', 'Basil'], ['soy'], 'v'),
  F(5, 2, 'Truffle Fettuccine', 'Pasta', 420, '1621996346565-e3dbc646d9a9', 'Fresh egg pasta in a creamy mushroom and truffle sauce.', ['Egg pasta|wheat', 'Eggs|eggs', 'Cream|milk', 'Mushrooms', 'Truffle oil'], [], 'v'),
  F(6, 2, 'Pesto Gnocchi', 'Pasta', 390, '1551183053-bf91a1d81141', 'Potato gnocchi tossed in basil pesto with pine nuts.', ['Gnocchi|wheat', 'Pine nuts|treenuts', 'Parmesan|milk', 'Basil', 'Olive oil'], [], 'v'),
  F(7, 2, 'Classic Tiramisu', 'Dessert', 240, '1551024601-bec78aea704b', 'Espresso-soaked sponge layered with mascarpone cream.', ['Sponge fingers|wheat', 'Mascarpone|milk', 'Eggs|eggs', 'Espresso', 'Cocoa'], ['treenuts'], 'v'),
  F(8, 3, 'Salmon Nigiri Platter', 'Sushi', 520, '1579871494447-9811cf80d66c', 'Eight pieces of salmon nigiri with pickled ginger and soy sauce.', ['Salmon|fish', 'Sushi rice', 'Soy sauce|soy', 'Wasabi'], ['sesame', 'shellfish'], ''),
  F(9, 3, 'Vegetable Tempura Udon', 'Noodles', 380, '1569718212165-3a8278d5f624', 'Hot udon noodle soup topped with crispy vegetable tempura.', ['Udon noodles|wheat', 'Tempura batter|wheat', 'Soy broth|soy', 'Seasonal vegetables'], ['shellfish', 'eggs'], 'v'),
  F(10, 3, 'Chicken Katsu Curry', 'Mains', 360, '1604908176997-125f25cc6f3d', 'Crumbed chicken cutlet with Japanese curry and rice.', ['Chicken', 'Breadcrumbs', 'Curry sauce', 'Rice'], [], '', false),
  F(11, 4, 'Paneer Butter Masala', 'Curry', 310, '1585937421612-70a008356fbe', 'Soft paneer in a rich tomato, butter and cashew gravy.', ['Paneer|milk', 'Butter|milk', 'Cashews|treenuts', 'Tomato', 'Spices'], [], 'v'),
  F(12, 4, 'Chana Masala', 'Curry', 240, '1631452180519-c014fe946bc7', 'Slow-cooked chickpeas in a tangy onion-tomato masala.', ['Chickpeas', 'Onion', 'Tomato', 'Spices'], [], 'V'),
  F(13, 4, 'Butter Naan Basket', 'Breads', 120, '1626074353765-517a681e40be', 'Three tandoor-baked naans brushed with butter.', ['Wheat flour|wheat', 'Butter|milk', 'Yogurt|milk'], [], 'v'),
  F(14, 5, 'Classic Cheeseburger', 'Burgers', 299, '1568901346375-23c9450c58cd', 'Beef patty, cheddar, lettuce and house sauce in a sesame bun.', ['Sesame bun|wheat', 'Sesame seeds|sesame', 'Beef patty', 'Cheddar|milk', 'House sauce|eggs'], [], ''),
  F(15, 5, 'Crispy Chicken Wrap', 'Burgers', 260, '1626700051175-6818013e1d4f', 'Fried chicken, slaw and sauce in a toasted tortilla wrap.', ['Chicken', 'Tortilla', 'Slaw', 'Sauce'], [], '', false),
  F(16, 5, 'Sweet Potato Fries', 'Sides', 150, '1630384060421-cb20d0e0649d', 'Crispy sweet potato fries with sea salt.', ['Sweet potato', 'Sea salt', 'Sunflower oil'], ['wheat', 'soy'], 'V'),
  F(17, 6, 'Veggie Tacos', 'Tacos', 250, '1565299585323-38d6b0865b47', 'Corn tortillas with grilled peppers, black beans and salsa.', ['Corn tortillas', 'Peppers', 'Black beans', 'Salsa', 'Lime'], ['soy'], 'V'),
  F(18, 6, 'Prawn Tacos', 'Tacos', 340, '1551504734-5ee1c4a1479b', 'Grilled prawns with cabbage slaw and chipotle crema.', ['Prawns|shellfish', 'Corn tortillas', 'Cabbage', 'Chipotle crema|milk'], ['fish'], ''),
  F(19, 6, 'Churros with Chocolate', 'Dessert', 210, '1624371414361-e670edf4898e', 'Cinnamon churros with warm chocolate dipping sauce.', ['Churro dough|wheat', 'Chocolate sauce|milk', 'Cinnamon', 'Sugar'], ['eggs'], 'v')
];
const TOPPINGS = [
  { id: 't1', n: 'Extra cheese', p: 40, a: 'milk' }, { id: 't2', n: 'Peanut crunch', p: 30, a: 'peanuts' },
  { id: 't3', n: 'Avocado slices', p: 50, a: null }, { id: 't4', n: 'Fried egg', p: 35, a: 'eggs' },
  { id: 't5', n: 'Sesame seeds', p: 15, a: 'sesame' }, { id: 't6', n: 'Fresh herbs', p: 10, a: null }
];
const rById = id => RESTAURANTS.find(r => r.id === +id);
const iById = id => ITEMS.find(i => i.id === +id);

/* ---------- Shared layout ---------- */
function layout() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const links = [['index.html', 'Home'], ['restaurants.html', 'Restaurants'], ['menu.html', 'Menu'], ['profile.html', 'Allergy Profile'], ['dashboard.html', 'Dashboard']];
  const prof = SB.get('profile', null);
  const chip = prof === null ? 'Set allergy profile' : prof.length ? `${prof.length} allerg${prof.length > 1 ? 'ies' : 'y'} active` : 'No allergies set';
  SB.q('#site-header').innerHTML = `<div class="wrap nav">
    <a class="brand" href="index.html"><img src="assets/icons/logo.svg" alt="" width="34" height="34"><span>SafeBite</span></a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">☰</button>
    <nav id="nav-links" aria-label="Main">${links.map(l => `<a href="${l[0]}" ${page === l[0] ? 'aria-current="page"' : ''}>${l[1]}</a>`).join('')}</nav>
    <div class="nav-right"><a class="pill" href="profile.html" title="Your allergy profile">🛡 ${chip}</a><a class="cart-link" href="cart.html" aria-label="Cart">🛒<span id="cart-count" class="count">0</span></a></div></div>`;
  SB.q('#site-footer').innerHTML = `<div class="wrap foot"><div><a class="brand" href="index.html"><img src="assets/icons/logo.svg" alt="" width="30" height="30"><span>SafeBite</span></a><p class="muted">Allergen-safe food ordering. College UI/UX project prototype.</p></div>
    <div><h4>Explore</h4><a href="restaurants.html">Restaurants</a><a href="menu.html">Full menu</a><a href="profile.html">Allergy profile</a></div>
    <div><h4>Account</h4><a href="dashboard.html">Dashboard</a><a href="cart.html">Cart</a><a href="checkout.html">Checkout</a></div>
    <p class="disclaimer">Allergen data in this prototype is sample data. Always confirm with the restaurant before eating if you have a serious allergy.</p></div>`;
  const btn = SB.q('.menu-btn'), nav = SB.q('#nav-links');
  btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
  if (typeof updateBadge === 'function') updateBadge();
}

/* ---------- Restaurant card ---------- */
function restCard(r) {
  const items = ITEMS.filter(i => i.r === r.id);
  const prof = SB.get('profile', null);
  const fit = prof === null ? '' : `<p class="fit">${items.filter(i => evaluate(i).level === 'green').length} of ${items.length} dishes look safe for you</p>`;
  return `<article class="card rcard"><img src="${r.img}" alt="${SB.esc(r.name)} food" loading="lazy" onerror="SB.imgFail(this)">
    <div class="card-b"><h3>${r.name}</h3><p class="meta"><span>${r.cuisine}</span><span>★ ${r.rating}</span><span>${r.time} min</span></p>
    <p class="safe-note"><span aria-hidden="true">🛡</span> ${r.safety}</p>${fit}
    <a class="btn btn-sm" href="menu.html?r=${r.id}">View menu</a></div></article>`;
}

/* ---------- Home ---------- */
PAGES.home = () => {
  const cats = [['Pizza', '🍕'], ['Burgers', '🍔'], ['Pasta', '🍝'], ['Sushi', '🍣'], ['Curry', '🍛'], ['Salads', '🥗'], ['Tacos', '🌮'], ['Dessert', '🍰']];
  SB.q('#cats').innerHTML = cats.map(c => `<a class="cat" href="menu.html?cat=${c[0]}"><span aria-hidden="true">${c[1]}</span>${c[0]}</a>`).join('');
  SB.q('#featured').innerHTML = [...RESTAURANTS].sort((a, b) => b.rating - a.rating).slice(0, 3).map(restCard).join('');
  const prof = SB.get('profile', null);
  SB.q('#hero-profile').innerHTML = prof === null
    ? 'You have not set your allergy profile yet. It takes 30 seconds.'
    : prof.length ? `Your profile: <strong>${aList(prof)}</strong>. Dishes are checked against it automatically.` : 'Your profile is saved with no allergies.';
};

/* ---------- Restaurants ---------- */
PAGES.restaurants = () => {
  const cuisines = [...new Set(RESTAURANTS.map(r => r.cuisine))];
  SB.q('#f-cuisine').innerHTML += cuisines.map(c => `<option>${c}</option>`).join('');
  const hasVeg = r => ITEMS.some(i => i.r === r.id && i.veg), hasVegan = r => ITEMS.some(i => i.r === r.id && i.vegan);
  const q0 = SB.param('q'); if (q0) SB.q('#f-q').value = q0;
  const render = () => {
    const q = SB.q('#f-q').value.trim().toLowerCase(), c = SB.q('#f-cuisine').value, t = +SB.q('#f-time').value;
    const veg = SB.q('#f-veg').checked, vegan = SB.q('#f-vegan').checked;
    const list = RESTAURANTS.filter(r => (!q || (r.name + r.cuisine).toLowerCase().includes(q)) && (!c || r.cuisine === c) && (!t || r.time <= t) && (!veg || hasVeg(r)) && (!vegan || hasVegan(r)));
    SB.q('#r-count').textContent = `${list.length} restaurant${list.length === 1 ? '' : 's'} found`;
    SB.q('#r-grid').innerHTML = list.length ? list.map(restCard).join('') : '<p class="empty">No restaurants match these filters. Try clearing one.</p>';
  };
  SB.qa('.filters input,.filters select').forEach(e => e.addEventListener('input', render));
  SB.q('#f-reset').addEventListener('click', () => { SB.q('#f-form').reset(); render(); });
  render();
};

/* ---------- Dashboard ---------- */
PAGES.dashboard = () => {
  const user = SB.get('user', { name: '' });
  const prof = SB.get('profile', null), orders = SB.get('orders', []);
  SB.q('#u-name').value = user.name || '';
  SB.q('#u-save').addEventListener('click', () => { SB.set('user', { ...user, name: SB.q('#u-name').value.trim() }); SB.toast('Name saved'); SB.q('#u-hello').textContent = 'Hello, ' + (SB.q('#u-name').value.trim() || 'Guest'); });
  SB.q('#u-hello').textContent = 'Hello, ' + (user.name || 'Guest');
  SB.q('#d-allergies').innerHTML = prof === null ? '<p class="muted">No profile saved yet.</p>' : prof.length ? prof.map(a => `<span class="chip hit">${ALLERGENS.find(x => x.id === a).icon} ${aName(a)}</span>`).join('') : '<p class="muted">Saved with no allergies.</p>';
  SB.q('#d-orders').innerHTML = orders.length ? orders.map(o => `<article class="card order"><div><h3>${o.id}</h3><p class="muted">${new Date(o.date).toLocaleString()} · ${o.payment}</p><p>${o.items.map(i => `${i.qty}× ${SB.esc(i.name)}`).join(', ')}</p></div><strong>${SB.money(o.total)}</strong></article>`).join('') : '<p class="empty">No orders yet. <a href="restaurants.html">Browse restaurants</a></p>';
  SB.q('#logout').addEventListener('click', () => { SB.del('user'); SB.del('cart'); SB.toast('Logged out. Your allergy profile stays saved on this device.'); setTimeout(() => location.href = 'index.html', 900); });
};

document.addEventListener('DOMContentLoaded', () => {
  layout();
  const fn = PAGES[document.body.dataset.page]; if (fn) fn();
});
