// Supabase Connection (SAFE INITIALIZATION)

const SUPABASE_URL = "https://ivvsoqjnzlxmgthfscer.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnNvcWpuemx4bWd0aGZzY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMwMTAsImV4cCI6MjA4NzAxOTAxMH0.rfJ_31yC5iKcRrfMWndJbOT5-EaKdAtFUy9KGaz1Mow";

let supabaseClient = null;

if (window.supabase) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  console.log("Supabase Connected");
} else {
  console.log("Supabase not loaded yet");
}
let languageSelected = false;
let filter = "all";
let cart = [];
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

  let menuHTML = filteredMenu.map(item => `
    <div class="card">
      <h3>${item.name}</h3>
      <p>₹${item.price}</p>
      <button class="btn" onclick="addToCart(${item.id})">Add</button>
      <button class="btn" onclick="openCustomize(${item.id})">Customize</button>
    </div>
  `).join("");

  document.getElementById("app").innerHTML = `
    <header>
      <h2>Divine Dine</h2>
      <div>
        <button class="btn veg" onclick="setFilter('veg')">Veg</button>
        <button class="btn nonveg" onclick="setFilter('nonveg')">Non-Veg</button>
        <button class="btn" onclick="setFilter('all')">All</button>
      </div>
    </header>

    <div style="padding-bottom:350px;">
      ${menuHTML}
    </div>

    ${renderCart()}
  `;
}

function setFilter(type) {
  filter = type;
  renderMenu();
}

function addToCart(id, addons = [], instructions = "") {
  let item = menu.find(m => m.id === id);

  let existing = cart.find(ci =>
    ci.id === id &&
    JSON.stringify(ci.addons) === JSON.stringify(addons) &&
    ci.instructions === instructions
  );

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: id,
      name: item.name,
      basePrice: item.price,
      addons: addons,
      instructions: instructions,
      qty: 1
    });
  }

  renderMenu();
}

function openCustomize(id) {
  let item = menu.find(m => m.id === id);

  document.body.innerHTML += `
    <div id="popup" style="
      position:fixed;
      top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.6);
      display:flex;
      justify-content:center;
      align-items:center;">
      
      <div style="background:white;padding:20px;width:300px;border-radius:8px;">
        <h3>${item.name}</h3>

        <label><input type="checkbox" value="Butter"> Extra Butter (+₹10)</label><br>
        <label><input type="checkbox" value="Ghee"> Extra Ghee (+₹10)</label><br>
        <label><input type="checkbox" value="Spicy"> Extra Spicy (+₹10)</label><br><br>

        <textarea id="instructions" placeholder="Special instructions"
          style="width:100%;height:60px;"></textarea><br><br>

        <button class="btn" onclick="addCustomized(${id})">Add to Cart</button>
        <button class="btn" onclick="closePopup()">Cancel</button>
      </div>
    </div>
  `;
}

function closePopup() {
  document.getElementById("popup").remove();
}

function addCustomized(id) {
  let checkboxes = document.querySelectorAll("#popup input[type=checkbox]:checked");
  let instructions = document.getElementById("instructions").value;

  let addons = [];
  checkboxes.forEach(cb => addons.push(cb.value));

  addToCart(id, addons, instructions);
  closePopup();
}

function increaseQty(index) {
  cart[index].qty += 1;
  renderMenu();
}

function decreaseQty(index) {
  cart[index].qty -= 1;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  renderMenu();
}

function renderCart() {
  let subtotal = 0;

  let itemsHTML = cart.map((item, index) => {
    let addonTotal = item.addons.length * 10;
    let itemPrice = (item.basePrice + addonTotal) * item.qty;
    subtotal += itemPrice;

    return `
      <div style="
        background:#fff;
        padding:10px;
        margin-bottom:10px;
        border-radius:8px;
        box-shadow:0 2px 5px rgba(0,0,0,0.1);">
        
        <strong>${item.name}</strong>
        ${item.addons.length ? `<div style="font-size:12px;color:#555;">Add-ons: ${item.addons.join(", ")}</div>` : ""}
        ${item.instructions ? `<div style="font-size:12px;color:#777;">Note: ${item.instructions}</div>` : ""}
        
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px;">
          <div>
            <button class="btn" onclick="decreaseQty(${index})">-</button>
            <span style="margin:0 10px;">${item.qty}</span>
            <button class="btn" onclick="increaseQty(${index})">+</button>
          </div>
          <div>₹${itemPrice.toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join("");

  let gst = subtotal * gstRate;
  let total = subtotal + gst;

  return `
    <div class="cart">
      <h3>Cart</h3>
      ${itemsHTML || "<p>No items added</p>"}
      <hr>
      <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
      <p>GST (5%): ₹${gst.toFixed(2)}</p>
      <h3>Total: ₹${total.toFixed(2)}</h3>
      <button class="btn" style="width:100%;background:#111;color:white;">
        Proceed to Pay
      </button>
    </div>
  `;
}

renderLanguageSelection();
