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
      <button class="btn" onclick="addNormal(${item.id})">Add</button>
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

    <div style="padding-bottom:300px;">
      ${menuHTML}
    </div>

    ${renderCart()}
  `;
}

function setFilter(type) {
  filter = type;
  renderMenu();
}

function addNormal(id) {
  let item = menu.find(m => m.id === id);
  cart.push({
    name: item.name,
    basePrice: item.price,
    addons: [],
    instructions: "",
    totalPrice: item.price
  });
  renderMenu();
}

function openCustomize(id) {
  let item = menu.find(m => m.id === id);

  document.getElementById("app").innerHTML += `
    <div id="popup" style="
      position:fixed;
      top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.6);
      display:flex;
      justify-content:center;
      align-items:center;">
      
      <div st
