import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ivvsoqjnzlxmgthfscer.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnNvcWpuemx4bWd0aGZzY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMwMTAsImV4cCI6MjA4NzAxOTAxMH0.rfJ_31yC5iKcRrfMWndJbOT5-EaKdAtFUy9KGaz1Mow";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let menuData = [];
let adminMode = false;

const GST_RATE = 0.05;

async function loadMenu() {
  const { data } = await supabase.from("menu").select("*").eq("is_available", true);
  menuData = data || [];
  renderMenu();
}

function renderMenu() {
  const app = document.getElementById("app");

  if (adminMode) {
    renderAdmin();
    return;
  }

  app.innerHTML = `
    <div style="display:flex;justify-content:space-between;padding:10px;">
      <h2>Divine Dine</h2>
      <button onclick="openAdmin()">Admin</button>
    </div>

    ${menuData.map(item => `
      <div class="card">
        <h3>${item.name}</h3>
        <p>₹${item.price}</p>
        <button onclick="addToCart(${item.id})">Add</button>
      </div>
    `).join("")}

    <div id="cartSection"></div>
  `;

  renderCart();
}

window.openAdmin = function() {
  adminMode = true;
  renderAdmin();
};

window.closeAdmin = function() {
  adminMode = false;
  loadMenu();
};

window.addToCart = function(id) {
  const item = menuData.find(i => i.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...item, qty: 1 });
  renderCart();
};

function renderCart() {
  const cartSection = document.getElementById("cartSection");
  if (!cart.length) {
    cartSection.innerHTML = "";
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  cartSection.innerHTML = `
    <div class="cart">
      ${cart.map(i => `
        <div style="display:flex;justify-content:space-between;">
          <span>${i.name} x ${i.qty}</span>
        </div>
      `).join("")}
      <hr>
      <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
      <p>GST: ₹${gst.toFixed(2)}</p>
      <h3>Total: ₹${total.toFixed(2)}</h3>
    </div>
  `;
}

async function renderAdmin() {
  const app = document.getElementById("app");

  const { data: orders } = await supabase.from("orders1").select("*");
  const { data: menu } = await supabase.from("menu").select("*");

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

  const monthlyRevenue = orders
    .filter(o => o.order_month === new Date().getMonth() + 1)
    .reduce((s, o) => s + (o.total_amount || 0), 0);

  const itemCount = {};
  orders.forEach(o => {
    if (o.items) {
      o.items.forEach(i => {
        itemCount[i.name] = (itemCount[i.name] || 0) + i.qty;
      });
    }
  });

  const mostOrdered = Object.entries(itemCount).sort((a,b)=>b[1]-a[1])[0];
  const leastOrdered = Object.entries(itemCount).sort((a,b)=>a[1]-b[1])[0];

  const hourCount = {};
  orders.forEach(o => {
    hourCount[o.order_hour] = (hourCount[o.order_hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourCount).sort((a,b)=>b[1]-a[1])[0];

  app.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <h2>Admin Dashboard</h2>
      <button onclick="closeAdmin()">Back</button>
    </div>

    <h3>Total Revenue: ₹${totalRevenue.toFixed(2)}</h3>
    <h3>This Month: ₹${monthlyRevenue.toFixed(2)}</h3>

    <h3>Most Ordered Item: ${mostOrdered ? mostOrdered[0] : "N/A"}</h3>
    <h3>Least Ordered Item: ${leastOrdered ? leastOrdered[0] : "N/A"}</h3>
    <h3>Peak Order Hour: ${peakHour ? peakHour[0] + ":00" : "N/A"}</h3>

    <hr>
    <h3>Menu Management</h3>

    ${menu.map(item => `
      <div class="card">
        <input value="${item.name}" id="name-${item.id}">
        <input value="${item.price}" id="price-${item.id}">
        <button onclick="updateMenu(${item.id})">Update</button>
        <button onclick="deleteMenu(${item.id})">Delete</button>
      </div>
    `).join("")}

    <hr>
    <h4>Add New Item</h4>
    <input id="newName" placeholder="Item Name">
    <input id="newPrice" placeholder="Price">
    <button onclick="addMenu()">Add Item</button>
  `;
}

window.addMenu = async function() {
  const name = document.getElementById("newName").value;
  const price = document.getElementById("newPrice").value;

  await supabase.from("menu").insert([{ name, price }]);
  renderAdmin();
};

window.updateMenu = async function(id) {
  const name = document.getElementById("name-"+id).value;
  const price = document.getElementById("price-"+id).value;

  await supabase.from("menu").update({ name, price }).eq("id", id);
  renderAdmin();
};

window.deleteMenu = async function(id) {
  await supabase.from("menu").delete().eq("id", id);
  renderAdmin();
};

loadMenu();
