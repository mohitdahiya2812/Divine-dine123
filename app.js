const supabaseUrl = "https://ivvsoqjnzlxmgthfscer.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnNvcWpuemx4bWd0aGZzY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMwMTAsImV4cCI6MjA4NzAxOTAxMH0.rfJ_31yC5iKcRrfMWndJbOT5-EaKdAtFUy9KGaz1Mow"; // keep your real key
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let cart = [];
let currentCustomer = null;
let isAdmin = false;

const app = document.getElementById("app");

/* ---------------- SWITCH VIEWS ---------------- */

function showCustomer() {
  isAdmin = false;
  renderMenu();
}

function showAdmin() {
  isAdmin = true;
  renderAdmin();
}

/* ---------------- HOME SCREEN ---------------- */

function renderHome() {
  app.innerHTML = `
    <div style="padding:20px;">
      <h2>Divine Dine</h2>
      <button onclick="showCustomer()" style="padding:10px;margin:10px;">Customer</button>
      <button onclick="showAdmin()" style="padding:10px;margin:10px;">Admin</button>
    </div>
  `;
}

renderHome();

/* ---------------- CUSTOMER MENU ---------------- */

async function renderMenu() {
  const { data: menu } = await supabase.from("menu").select("*");

  let html = `
    <button onclick="renderHome()">⬅ Back</button>
    <h2>Menu</h2>
  `;

  menu.forEach(item => {
    if (!item.available) return;

    html += `
      <div class="card">
        <h3>${item.name}</h3>
        <p>₹ ${item.price}</p>
        <button onclick="addToCart(${item.id}, '${item.name}', ${item.price})">
          Add
        </button>
      </div>
    `;
  });

  html += `
    <div class="cart">
      <h3>Cart</h3>
      ${renderCart()}
    </div>
  `;

  app.innerHTML = html;
}

function addToCart(id, name, price) {
  cart.push({ id, name, price });
  renderMenu();
}

function renderCart() {
  if (cart.length === 0) return "Cart empty";

  let total = cart.reduce((sum, i) => sum + i.price, 0);

  return `
    ${cart.map(i => `<p>${i.name} - ₹${i.price}</p>`).join("")}
    <hr>
    <b>Total: ₹${total}</b><br><br>
    <button onclick="placeOrder()">Proceed to Pay</button>
  `;
}

async function placeOrder() {
  if (cart.length === 0) return alert("Cart empty");

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  await supabase.from("orders1").insert([
    {
      total_amount: total,
      created_at: new Date()
    }
  ]);

  alert("Order Placed!");
  cart = [];
  renderMenu();
}

/* ---------------- ADMIN PANEL ---------------- */

function renderAdmin() {
  app.innerHTML = `
    <button onclick="renderHome()">⬅ Back</button>
    <h2>Admin Panel</h2>

    <button onclick="showMonthlySales()">Monthly Sales</button>
    <button onclick="showMostConsumed()">Most Consumed Item</button>
    <button onclick="showLeastConsumed()">Least Consumed Item</button>
    <button onclick="showPeakTiming()">Peak Order Timings</button>
    <button onclick="showTopWaiter()">Top Waiter</button>

    <div id="adminContent" style="margin-top:20px;"></div>
  `;
}

/* ---------------- ADMIN FUNCTIONS ---------------- */

async function showMonthlySales() {
  const { data } = await supabase
    .from("order_items")
    .select("item_name, quantity");

  let summary = {};

  data.forEach(item => {
    summary[item.item_name] =
      (summary[item.item_name] || 0) + item.quantity;
  });

  let html = "<h3>Monthly Sales</h3>";

  for (let item in summary) {
    html += `<p>${item} : ${summary[item]} sold</p>`;
  }

  document.getElementById("adminContent").innerHTML = html;
}

async function showMostConsumed() {
  const { data } = await supabase
    .from("order_items")
    .select("item_name, quantity");

  let summary = {};

  data.forEach(item => {
    summary[item.item_name] =
      (summary[item.item_name] || 0) + item.quantity;
  });

  let maxItem = Object.keys(summary).reduce((a, b) =>
    summary[a] > summary[b] ? a : b
  );

  document.getElementById("adminContent").innerHTML =
    `<h3>Most Consumed</h3><p>${maxItem} (${summary[maxItem]} sold)</p>`;
}

async function showLeastConsumed() {
  const { data } = await supabase
    .from("order_items")
    .select("item_name, quantity");

  let summary = {};

  data.forEach(item => {
    summary[item.item_name] =
      (summary[item.item_name] || 0) + item.quantity;
  });

  let minItem = Object.keys(summary).reduce((a, b) =>
    summary[a] < summary[b] ? a : b
  );

  document.getElementById("adminContent").innerHTML =
    `<h3>Least Consumed</h3><p>${minItem} (${summary[minItem]} sold)</p>`;
}

async function showPeakTiming() {
  const { data } = await supabase
    .from("orders1")
    .select("created_at");

  let hours = {};

  data.forEach(order => {
    let hour = new Date(order.created_at).getHours();
    hours[hour] = (hours[hour] || 0) + 1;
  });

  let peak = Object.keys(hours).reduce((a, b) =>
    hours[a] > hours[b] ? a : b
  );

  document.getElementById("adminContent").innerHTML =
    `<h3>Peak Hour</h3><p>${peak}:00 (${hours[peak]} orders)</p>`;
}

async function showTopWaiter() {
  const { data } = await supabase
    .from("orders1")
    .select("waiter_name");

  let summary = {};

  data.forEach(order => {
    summary[order.waiter_name] =
      (summary[order.waiter_name] || 0) + 1;
  });

  let top = Object.keys(summary).reduce((a, b) =>
    summary[a] > summary[b] ? a : b
  );

  document.getElementById("adminContent").innerHTML =
    `<h3>Top Waiter</h3><p>${top} (${summary[top]} orders)</p>`;
}
