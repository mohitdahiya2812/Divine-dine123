let languageSelected = false;
let filter = "all";
let cart = {};
const gstRate = 0.05;

const menu = [
  { id: 1, name: "Paneer Butter Masala", price: 260, veg: true },
  { id: 2, name: "Dal Makhani", price: 220, veg: true },
  { id: 3, name: "Veg Burger", price: 120, veg: true },
  { id: 4, name: "Chicken Curry", price: 320, veg: false }
];

function renderLanguageSelection() {
  document.getElementById("app").innerHTML = `
    <div style="text-align:center;padding:100px;">
      <h1>Divine Dine</h1>
      <button class="btn" onclick="selectLanguage()">English</button>
      <button class="btn" onclick="selectLanguage()">हिंदी</button>
    </div>
  `;
}

function selectLanguage() {
  languageSelected = true;
  renderMenu();
}

function renderMenu() {
  let filteredMenu = menu.filter(item =>
    filter === "all" ? true : filter === "veg" ? item.veg : !item.veg
  );

  let menuHTML = filteredMenu.map(item => {
    let qty = cart[item.id]?.qty || 0;

    return `
      <div class="card">
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
        ${
          qty === 0
            ? `<button class="btn" onclick="addToCart(${item.id})">Add</button>`
            : `
              <button class="btn" onclick="decreaseQty(${item.id})">-</button>
              <span style="margin:0 10px;">${qty}</span>
              <button class="btn" onclick="increaseQty(${item.id})">+</button>
            `
        }
      </div>
    `;
  }).join("");

  document.getElementById("app").innerHTML = `
    <header>
      <h2>Divine Dine</h2>
      <div>
        <button class="btn veg" onclick="setFilter('veg')">Veg</button>
        <button class="btn nonveg" onclick="setFilter('nonveg')">Non-Veg</button>
        <button class="btn" onclick="setFilter('all')">All</button>
      </div>
    </header>

    <div style="padding-bottom:220px;">
      ${menuHTML}
    </div>

    ${renderCart()}
  `;
}

function setFilter(type) {
  filter = type;
  renderMenu();
}

function addToCart(id) {
  cart[id] = { ...menu.find(m => m.id === id), qty: 1 };
  renderMenu();
}

function increaseQty(id) {
  cart[id].qty += 1;
  renderMenu();
}

function decreaseQty(id) {
  cart[id].qty -= 1;
  if (cart[id].qty === 0) delete cart[id];
  renderMenu();
}

function renderCart() {
  let items = Object.values(cart);
  let subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  let gst = subtotal * gstRate;
  let total = subtotal + gst;

  return `
    <div class="cart">
      <h3>Cart</h3>
      <p>Items: ${items.length}</p>
      <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
      <p>GST (5%): ₹${gst.toFixed(2)}</p>
      <h3>Total: ₹${total.toFixed(2)}</h3>
      <button class="btn" onclick="alert('Payment system coming next')">Proceed to Pay</button>
    </div>
  `;
}

renderLanguageSelection();
