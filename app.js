import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ivvsoqjnzlxmgthfscer.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dnNvcWpuemx4bWd0aGZzY2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDMwMTAsImV4cCI6MjA4NzAxOTAxMH0.rfJ_31yC5iKcRrfMWndJbOT5-EaKdAtFUy9KGaz1Mow";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let cart = [];
let orderLocked = false;
let appliedCoupon = null;
let currentCustomer = null;
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

function calculateSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

function calculateDiscount(subtotal) {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.discount_type === "percentage")
    return (subtotal * appliedCoupon.discount_value) / 100;
  return appliedCoupon.discount_value;
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

window.checkCustomer = async function() {
  const phone = document.getElementById("custPhone").value.trim();
  if (!phone) return;

  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("phone", phone);

  if (data && data.length > 0) {
    currentCustomer = data[0];
    document.getElementById("custName").value = currentCustomer.name;
    alert("Welcome back " + currentCustomer.name + "!");
  } else {
    currentCustomer = null;
    document.getElementById("custName").value = "";
  }
};

window.applyCoupon = async function() {
  const code = document.getElementById("couponInput").value.trim();
  if (!code) return alert("Enter coupon code");

  const subtotal = calculateSubtotal();

  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code);

  if (!data || data.length === 0)
    return alert("Invalid coupon");

  const coupon = data[0];
  const now = new Date();

  if (!coupon.is_active) return alert("Coupon inactive");
  if (coupon.valid_from && new Date(coupon.valid_from) > now)
    return alert("Coupon not started yet");
  if (coupon.valid_until && new Date(coupon.valid_until) < now)
    return alert("Coupon expired");
  if (coupon.min_order_value > subtotal)
    return alert("Minimum order not met");
  if (coupon.max_total_uses && coupon.total_used >= coupon.max_total_uses)
    return alert("Coupon limit reached");

  appliedCoupon = coupon;
  renderCart();
  alert("Coupon Applied Successfully!");
};

window.removeCoupon = function() {
  appliedCoupon = null;
  renderCart();
};

function renderCart() {
  const cartSection = document.getElementById("cartSection");
  if (!cart.length) return (cartSection.innerHTML = "");

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const gst = (subtotal - discount) * GST_RATE;
  const total = subtotal - discount + gst;

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

      ${appliedCoupon ? `
        <p style="color:green;">Coupon: ${appliedCoupon.code}
        <button onclick="removeCoupon()">Remove</button></p>
        <p style="color:green;">Discount: -₹${discount.toFixed(2)}</p>
      ` : ""}

      <p>GST (5%): ₹${gst.toFixed(2)}</p>
      <h3>Total: ₹${total.toFixed(2)}</h3>

      <input id="couponInput" placeholder="Enter Coupon Code" style="width:100%;padding:8px;margin:5px 0;">
      <button onclick="applyCoupon()">Apply Coupon</button>

      <input id="custPhone" placeholder="Phone Number" onblur="checkCustomer()" style="width:100%;padding:8px;margin:5px 0;">
      <input id="custName" placeholder="Your Name" style="width:100%;padding:8px;margin:5px 0;">

      <button id="payBtn" onclick="placeOrder()">Proceed to Pay</button>
    </div>
  `;
}

window.placeOrder = async function() {
  if (orderLocked) return;

  const phone = document.getElementById("custPhone").value.trim();
  const name = document.getElementById("custName").value.trim();

  if (!phone || !name) return alert("Enter phone and name");

  orderLocked = true;
  const btn = document.getElementById("payBtn");
  btn.disabled = true;
  btn.innerText = "Processing...";

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const gst = (subtotal - discount) * GST_RATE;
  const total = subtotal - discount + gst;
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

  if (currentCustomer) {
    await supabase.from("customers")
      .update({
        total_visits: currentCustomer.total_visits + 1,
        total_spent: currentCustomer.total_spent + total,
        last_visit: new Date()
      })
      .eq("phone", phone);
  } else {
    await supabase.from("customers").insert([
      {
        name,
        phone,
        total_visits: 1,
        total_spent: total,
        first_visit: new Date(),
        last_visit: new Date()
      }
    ]);
  }

  if (appliedCoupon) {
    await supabase.from("coupons")
      .update({ total_used: appliedCoupon.total_used + 1 })
      .eq("id", appliedCoupon.id);
  }

  alert("Order Successful! Bill ID: " + billId);

  cart = [];
  appliedCoupon = null;
  currentCustomer = null;
  orderLocked = false;
  renderMenu();
};

renderMenu();
