import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ivvsoqjnzlxmgthfscer.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnNvcWpuemx4bWd0aGZzY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMwMTAsImV4cCI6MjA4NzAxOTAxMH0.rfJ_31yC5iKcRrfMWndJbOT5-EaKdAtFUy9KGaz1Mow";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let menuData = [];

const GST_RATE = 0.05;

/* ================= LOAD MENU ================= */

async function loadMenu() {
  const { data } = await supabase
    .from("menu")
    .select("*")
    .eq("is_available", true);

  menuData = data || [];
  renderCustomer();
}

/* ================= CUSTOMER VIEW ================= */

function renderCustomer() {
  const app = document.getElementById("app");

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
      ${cart.map(i => `<div>${i.name} x ${i.qty}</div>`).join("")}
      <hr>
      <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
      <p>GST: ₹${gst.toFixed(2)}</p>
      <h3>Total: ₹${total.toFixed(2)}</h3>
    </div>
  `;
}

/* ================= ADMIN ================= */

window.openAdmin = function() {
  renderAdmin();
};

window.closeAdmin = function() {
  loadMenu();
};

function renderAdmin() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div style="display:flex;justify-content:space-between;">
      <h2>Admin Dashboard</h2>
      <button onclick="closeAdmin()">Back</button>
    </div>

    <select id="adminSelector" onchange="handleAdminSelection()" style="margin:15px;padding:8px;">
      <option value="">Select Option</option>
      <option value="monthlySales">All Sales (This Month)</option>
      <option value="menuManage">Manage Menu</option>
    </select>

    <div id="adminContent"></div>
  `;
}

window.handleAdminSelection = async function() {
  const value = document.getElementById("adminSelector").value;
  const content = document.getElementById("adminContent");

  if (value === "monthlySales") {
    const { data: orders } = await supabase.from("orders1").select("*");

    const currentMonth = new Date().getMonth() + 1;

    const monthlyOrders = orders.filter(o =>
      new Date(o.created_at).getMonth() + 1 === currentMonth
    );

    const itemSummary = {};

    monthlyOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          itemSummary[item.name] =
            (itemSummary[item.name] || 0) + item.qty;
        });
      }
    });

    content.innerHTML = `
      <h3>Monthly Item Sales</h3>
      ${Object.entries(itemSummary).map(([name, qty]) => `
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:5px;">
          <span>${name}</span>
          <strong>${qty}</strong>
        </div>
      `).join("")}
    `;
  }

  if (value === "menuManage") {
    const { data: menu } = await supabase.from("menu").select("*");

    content.innerHTML = `
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
};

window.addMenu = async function() {
  const name = document.getElementById("newName").value;
  const price = document.getElementById("newPrice").value;

  await supabase.from("menu").insert([{ name, price }]);
  handleAdminSelection();
};

window.updateMenu = async function(id) {
  const name = document.getElementById("name-"+id).value;
  const price = document.getElementById("price-"+id).value;

  await supabase.from("menu").update({ name, price }).eq("id", id);
  handleAdminSelection();
};

window.deleteMenu = async function(id) {
  await supabase.from("menu").delete().eq("id", id);
  handleAdminSelection();
};

/* ================= START ================= */

loadMenu();
