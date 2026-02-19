import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ivvsoqjnzlxmgthfscer.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnNvcWpuemx4bWd0aGZzY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMwMTAsImV4cCI6MjA4NzAxOTAxMH0.rfJ_31yC5iKcRrfMWndJbOT5-EaKdAtFUy9KGaz1Mow";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let orderLocked = false;
const GST_RATE = 0.05;

const menu = [
  { id: 1, name: "Paneer Butter Masala", price: 220 },
  { id: 2, name: "Dal Tadka", price: 160 },
  { id: 3, name: "Veg Biryani", price: 180 },
  { id: 4, name: "Butter Naan", price: 40 },
  { id: 5, name: "Chicken Curry", price: 260 }
];

function generateBillId() {
  return "DD" + Date.now();
}

function renderMenu() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2 style="padding:15px;">Divine Dine</h2>
    ${menu.map(item => `
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
  if (orderLocked) return;

  const item = menu.find(i => i.id === id);
  const existing = cart.find(c => c.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }

  renderCart();
};

function renderCart() {
  const cartSection = document.getElementById("cartSection");
  if (!cart.length) {
    cartSection.innerHTML = "";
    return;
  }

  let subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let gst = subtotal * GST_RATE;
  let total = subtotal + gst;

  cartSection.innerHTML = `
    <div class="cart">
      ${cart.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>${item.name}</span>
          <div>
            <button onclick="changeQty(${item.id}, -1)">-</button>
            ${item.qty}
            <button onclick="changeQty(${item.id}, 1)">+</button>
          </div>
        </div>
      `).join("")}
      <hr>
      <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
      <p>GST (5%): ₹${gst.toFixed(2)}</p>
      <h3>Total: ₹${total.toFixed(2)}</h3>
      <input id="custName" placeholder="Your Name" style="width:100%;padding:8px;margin:5px 0;">
      <input id="custPhone" placeholder="Phone Number" style="width:100%;padding:8px;margin:5px 0;">
      <button id="payBtn" onclick="placeOrder()">Proceed to Pay</button>
    </div>
  `;
}

window.changeQty = function(id, change) {
  if (orderLocked) return;

  const item = cart.find(c => c.id === id);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }

  renderCart();
};

window.placeOrder = async function() {
  if (orderLocked) return;

  const button = document.getElementById("payBtn");
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  orderLocked = true;
  button.disabled = true;
  button.innerText = "Processing...";

  try {
    let subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    let gst = subtotal * GST_RATE;
    let total = subtotal + gst;
    const billId = generateBillId();

    const { error } = await supabase.from("orders1").insert([
      {
        bill_id: billId,
        customer_phone: phone,
        customer_name: name,
        table_number: "T1",
        items: cart,
        subtotal: subtotal,
        gst: gst,
        discount: 0,
        total_amount: total,
        payment_mode: "QR"
      }
    ]);

    if (error) {
      console.error(error);
      alert("Order failed. Try again.");
      orderLocked = false;
      button.disabled = false;
      button.innerText = "Proceed to Pay";
      return;
    }

    alert("Order Successful! Bill ID: " + billId);

    cart = [];
    orderLocked = false;
    renderMenu();

  } catch (err) {
    console.error(err);
    alert("Unexpected error occurred");
    orderLocked = false;
  }
};

renderMenu();
