import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ivvsoqjnzlxmgthfscer.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnNvcWpuemx4bWd0aGZzY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMwMTAsImV4cCI6MjA4NzAxOTAxMH0.rfJ_31yC5iKcRrfMWndJbOT5-EaKdAtFUy9KGaz1Mow";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let orderLocked = false;
let appliedCoupon = null;
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
  existing ? existing.qty++ : cart.push({ ...item, qty: 1 });
  renderCart();
};

window.changeQty = function(id, change) {
  if (orderLocked) return;
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += change;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  renderCart();
};

async function applyCoupon() {
  const code = document.getElementById("couponInput").value.trim();
  if (!code) return alert("Enter coupon code");

  let subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !coupon) return alert("Invalid coupon");

  if (!coupon.is_active) return alert("Coupon inactive");

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now)
    return alert("Coupon not started yet");

  if (coupon.valid_until && new Date(coupon.valid_until) < now)
    return alert("Coupon expired");

  if (coupon.min_order_value > subtotal)
    return alert("Minimum order not met");

  if (coupon.max_total_uses && coupon.total_used >= coupon.max_total_uses)
    return alert("Coupon usage limit reached");

  let discount = 0;
  if (coupon.discount_type === "percentage")
    discount = (subtotal * coupon.discount_value) / 100;
  else
    discount = coupon.discount_value;

  appliedCoupon = { ...coupon, discount };
  alert("Coupon Applied!");
  renderCart();
}

function renderCart() {
  const cartSection = document.getElementById("cartSection");
  if (!cart.length) return (cartSection.innerHTML = "");

  let subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = appliedCoupon ? appliedCoupon.discount : 0;
  let gst = (subtotal - discount) * GST_RATE;
  let total = subtotal - discount + gst;

  cartSection.innerHTML = `
    <div class="cart">
      ${cart.map(item => `
        <div style="display:flex;justify-content:space-between;">
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
      ${appliedCoupon ? `<p>Discount: -₹${discount.toFixed(2)}</p>` : ""}
      <p>GST (5%): ₹${gst.toFixed(2)}</p>
      <h3>Total: ₹${total.toFixed(2)}</h3>
      <input id="couponInput" placeholder="Enter Coupon Code" style="width:100%;padding:8px;margin:5px 0;">
      <button onclick="applyCoupon()">Apply Coupon</button>
      <input id="custName" placeholder="Your Name" style="width:100%;padding:8px;margin:5px 0;">
      <input id="custPhone" placeholder="Phone Number" style="width:100%;padding:8px;margin:5px 0;">
      <button id="payBtn" onclick="placeOrder()">Proceed to Pay</button>
    </div>
  `;
}

window.placeOrder = async function() {
  if (orderLocked) return;

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  if (!name || !phone) return alert("Enter name and phone");

  orderLocked = true;
  const btn = document.getElementById("payBtn");
  btn.disabled = true;
  btn.innerText = "Processing...";

  let subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = appliedCoupon ? appliedCoupon.discount : 0;
  let gst = (subtotal - discount) * GST_RATE;
  let total = subtotal - discount + gst;
  const billId = generateBillId();

  const { error } = await supabase.from("orders1").insert([
    {
      bill_id: billId,
      customer_phone: phone,
      customer_name: name,
      table_number: "T1",
      items: cart,
      subtotal,
      gst,
      discount,
      total_amount: total,
      payment_mode: "QR"
    }
  ]);

  if (error) {
    alert("Order failed");
    orderLocked = false;
    btn.disabled = false;
    btn.innerText = "Proceed to Pay";
    return;
  }

  if (appliedCoupon) {
    await supabase.from("coupons")
      .update({ total_used: appliedCoupon.total_used + 1 })
      .eq("id", appliedCoupon.id);
  }

  alert("Order Successful! Bill ID: " + billId);

  cart = [];
  appliedCoupon = null;
  orderLocked = false;
  renderMenu();
};

renderMenu();
