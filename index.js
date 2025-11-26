let var_developerUser = 0;
let var_viewingLogs = 0;
let var_discountPercentage = 0;
let var_taxPercentage = 0;
let var_purchaseLogs = [];
let var_inventoryItems = [];
let var_customerCashAmount = 0;
let var_customerChangeAmount = 0;

const func_querySelector = selector => document.querySelector(selector);
const func_formatPhp = number => `Php ${Number(number).toFixed(2)}`;

function func_tryImageExtensionsSetBackground(element, basePath, extensions = ["jpg", "png", "webp", "jpeg"]) {
  // Process:
  // 1. Validate inputs.
  // 2. Try each extension in order by creating an Image and setting src.
  // 3. On load: set element background and stop trying further extensions.
  // 4. On error: try next extension.
  if (!element || !basePath) return;
  let extensionIndex = 0;
  (function tryNextExtension() {
    if (extensionIndex >= extensions.length) {
      // all failed: clear background
      element.style.backgroundImage = "";
      return;
    }
    const url = `${basePath}.${extensions[extensionIndex++]}`;
    const image = new Image();
    image.onload = () => {
      // success: set background and release handlers
      element.style.backgroundImage = `url("${url}")`;
      image.onload = image.onerror = null;
    };
    image.onerror = () => {
      // failed: release handlers and try next
      image.onload = image.onerror = null;
      tryNextExtension();
    };
    image.src = url;
  })();
}

const func_imageBasePathForIID = iid => `assets/iid_image/${iid}`;

function func_assignInventoryIds() {
  // Process:
  // 1. Iterate inventory array.
  // 2. Ensure each item has sequential IID and normalized fields:
  //    - var_iid, var_imageBase, var_name, var_price, var_stock, var_quantity
  var_inventoryItems.forEach((item, index) => {
    const iid = index + 1;
    item.var_iid = iid;
    item.var_imageBase = item.var_imageBase || func_imageBasePathForIID(iid);
    item.var_name = item.var_name || `Item ${iid}`;
    item.var_price = Number(item.var_price || 0);
    item.var_stock = Number(item.var_stock || 0);
    item.var_quantity = Number(item.var_quantity || 0);
  });
}

function func_addNewItem() {
  // Process:
  // 1. Create a new item with sensible defaults.
  // 2. Push to inventory, reassign IDs, refresh UI.
  const newIid = var_inventoryItems.length + 1;
  var_inventoryItems.push({
    var_iid: newIid,
    var_name: `Item ${newIid}`,
    var_price: 1,
    var_stock: 1,
    var_quantity: 0,
    var_imageBase: func_imageBasePathForIID(newIid)
  });
  func_assignInventoryIds();
  func_refreshUI();
}

function func_removeItemByIID() {
  // Process:
  // 1. Prompt repeatedly for IID until valid or cancelled.
  // 2. Confirm removal.
  // 3. Remove item, reassign IDs, refresh UI, notify user.
  let parsedIid;
  while (true) {
    const raw = prompt("Enter IID of the item to remove:");
    if (raw === null) return; // cancel
    parsedIid = parseInt(raw, 10);
    if (!isNaN(parsedIid) && parsedIid >= 1 && parsedIid <= var_inventoryItems.length) break;
    alert("Invalid IID. Try again or Cancel to exit.");
  }
  const removeIndex = parsedIid - 1;
  const itemToRemove = var_inventoryItems[removeIndex];
  if (!confirm(`Remove IID ${parsedIid} - "${itemToRemove.var_name}"?`)) return;
  var_inventoryItems.splice(removeIndex, 1);
  func_assignInventoryIds();
  func_refreshUI();
  alert(`Item IID ${parsedIid} removed.`);
}

function func_editItemByIID() {
  // Process:
  // 1. Prompt for IID (loop until valid or cancel).
  // 2. Prompt for field to edit (name, stock, price).
  // 3. Prompt for new value; validate depending on field.
  // 4. Confirm change; apply and refresh UI.
  let parsedIid;
  while (true) {
    const raw = prompt("Enter IID of the item to edit:");
    if (raw === null) return;
    parsedIid = parseInt(raw, 10);
    if (!isNaN(parsedIid) && parsedIid >= 1 && parsedIid <= var_inventoryItems.length) break;
    alert("Invalid IID. Try again or Cancel to exit.");
  }
  const item = var_inventoryItems[parsedIid - 1];

  let chosenField;
  while (true) {
    const fieldRaw = prompt("Which field to edit? Enter: name, stock, price");
    if (fieldRaw === null) return;
    chosenField = fieldRaw.trim().toLowerCase();
    if (["name", "stock", "price"].includes(chosenField)) break;
    alert("Invalid choice. Use name, stock, or price.");
  }

  while (true) {
    const currentValue = chosenField === "name" ? item.var_name : chosenField === "stock" ? item.var_stock : item.var_price;
    const newValueRaw = prompt(`Enter new value for ${chosenField} (current: ${currentValue}):`);
    if (newValueRaw === null) return;

    if (chosenField === "name") {
      const newName = newValueRaw.trim();
      if (!newName) { alert("Name cannot be empty."); continue; }
      if (!confirm(`Change name from "${item.var_name}" to "${newName}"?`)) { alert("Change cancelled."); continue; }
      item.var_name = newName;
      break;
    }

    if (chosenField === "stock") {
      const newStock = parseInt(newValueRaw, 10);
      if (isNaN(newStock) || newStock < 0) { alert("Stock must be a non-negative integer."); continue; }
      if (!confirm(`Change stock from ${item.var_stock} to ${newStock}?`)) { alert("Change cancelled."); continue; }
      item.var_stock = newStock;
      if (item.var_quantity > newStock) item.var_quantity = newStock;
      break;
    }

    const newPrice = parseFloat(newValueRaw);
    if (isNaN(newPrice) || newPrice < 0) { alert("Price must be a non-negative number."); continue; }
    if (!confirm(`Change price from ${func_formatPhp(item.var_price)} to ${func_formatPhp(newPrice)}?`)) { alert("Change cancelled."); continue; }
    item.var_price = newPrice;
    break;
  }

  func_refreshUI();
  alert(`Item IID ${parsedIid} updated.`);
}

function func_calculateTotals() {
  // Process:
  // 1. Sum line totals for items with quantity >= 1 to get subtotal.
  // 2. Compute discount, afterDiscount, tax, total.
  const subtotal = var_inventoryItems.reduce((sum, item) => sum + (item.var_quantity >= 1 ? item.var_price * item.var_quantity : 0), 0);
  const discountAmount = subtotal * (var_discountPercentage / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (var_taxPercentage / 100);
  const totalAmount = afterDiscount + taxAmount;
  return { subtotal, discountAmount, afterDiscount, taxAmount, totalAmount };
}

function func_displayOrNoInput(value) {
  // Show "No Inputs" when zero, otherwise formatted currency
  return value === 0 ? "No Inputs" : func_formatPhp(value);
}

function func_updateSummary() {
  // Process:
  // 1. Calculate totals.
  // 2. Update DOM nodes for subtotal, discount, tax, total, customer cash, change, and percentage labels.
  const totals = func_calculateTotals();
  const setText = (selector, text) => { const el = func_querySelector(selector); if (el) el.textContent = text; };
  setText("#div-subtotal_value", func_displayOrNoInput(totals.subtotal));
  setText("#div-discount_value", func_displayOrNoInput(totals.discountAmount));
  setText("#div-tax_value", func_displayOrNoInput(totals.taxAmount));
  setText("#div-total_amount_value", func_displayOrNoInput(totals.totalAmount));
  setText("#div-customer_cash_value", func_displayOrNoInput(var_customerCashAmount));
  setText("#div-customer_change_value", func_displayOrNoInput(var_customerChangeAmount));
  setText("#div-discount_percentage_value", `Discount: ${var_discountPercentage}%`);
  setText("#div-tax_percentage_value", `Tax: ${var_taxPercentage}%`);
}

function func_updateButtonsState() {
  // Process:
  // 1. Count total quantity in cart.
  // 2. Enable/disable purchase and clear buttons accordingly.
  const checkoutContainer = func_querySelector("#div-checkout");
  if (!checkoutContainer) return;
  const purchaseButton = checkoutContainer.querySelector(".div-purchase_button");
  const clearButton = checkoutContainer.querySelector(".div-clear_list");
  const cartCount = var_inventoryItems.reduce((acc, item) => acc + (item.var_quantity >= 1 ? item.var_quantity : 0), 0);
  if (purchaseButton) purchaseButton.disabled = cartCount === 0;
  if (clearButton) clearButton.disabled = cartCount === 0;
}

function func_refreshUI() {
  // Centralized refresh: re-render checkout items, update summary, buttons, and inventory
  func_renderCheckoutItems();
  func_updateSummary();
  func_updateButtonsState();
  func_renderInventory();
}

function func_renderCheckoutItems() {
  // Process:
  // 1. Clear list container.
  // 2. For each item with quantity >= 1, create a row with + and - buttons and line total.
  // 3. Attach delegated click handler to handle quantity changes.
  const listContainer = func_querySelector("#div-list");
  if (!listContainer) return;
  listContainer.innerHTML = "";
  var_inventoryItems.forEach((item, index) => {
    if (item.var_quantity >= 1) {
      const row = document.createElement("div");
      row.className = "div-listed_item";
      row.dataset.index = index;
      row.innerHTML = `
        <p class="div-listed_item_name">${item.var_name}</p>
        <button class="div-listed_item_add_quantity">+</button>
        <p class="div-listed_item_quantity_value">${item.var_quantity}</p>
        <button class="div-listed_item_subtract_quantity">-</button>
        <p class="div-listed_item_price">${func_formatPhp(item.var_price * item.var_quantity)}</p>
      `;
      listContainer.appendChild(row);
    }
  });

  listContainer.onclick = event => {
    const clickedButton = event.target.closest("button");
    if (!clickedButton) return;
    const parentRow = clickedButton.closest(".div-listed_item");
    if (!parentRow) return;
    const itemIndex = Number(parentRow.dataset.index);
    const item = var_inventoryItems[itemIndex];
    if (!item) return;
    if (clickedButton.classList.contains("div-listed_item_add_quantity")) {
      // increment quantity if stock allows
      if (item.var_quantity < item.var_stock) item.var_quantity++;
      else alert("Reached maximum stock for this item.");
    } else if (clickedButton.classList.contains("div-listed_item_subtract_quantity")) {
      // decrement quantity if > 0
      if (item.var_quantity > 0) item.var_quantity--;
    }
    func_refreshUI();
  };
}

function func_handlePurchase() {
  // Process:
  // 1. Validate cart not empty.
  // 2. Calculate totals.
  // 3. If no customer cash recorded, prompt repeatedly until cash >= total or cancel.
  // 4. If recorded cash insufficient (totals changed), reset and ask again.
  // 5. Confirm purchase; if confirmed, log sale, deduct stock, clear cart, thank customer.
  const cartItems = var_inventoryItems.filter(item => item.var_quantity >= 1);
  if (!cartItems.length) { alert("No items in cart to purchase."); return; }
  const totals = func_calculateTotals();

  if (!var_customerCashAmount || var_customerCashAmount <= 0) {
    // require cash >= total; loop until valid or cancel
    while (true) {
      const raw = prompt(`Enter customer cash amount (must be at least ${func_formatPhp(totals.totalAmount)}):`);
      if (raw === null) return;
      const parsedCash = parseFloat(raw);
      if (isNaN(parsedCash) || parsedCash < 0) { alert("Invalid cash amount. Enter a non-negative number."); continue; }
      if (parsedCash < totals.totalAmount) { alert(`Cash must be at least ${func_formatPhp(totals.totalAmount)}. Please enter sufficient amount or Cancel.`); continue; }
      var_customerCashAmount = parsedCash;
      var_customerChangeAmount = Math.max(0, var_customerCashAmount - totals.totalAmount);
      func_updateSummary();
      alert("Cash recorded. Press PURCHASE again to proceed.");
      return;
    }
  }

  // Re-check totals in case they changed after cash entry
  if (var_customerCashAmount < totals.totalAmount) {
    alert(`Recorded cash is now insufficient. Need ${func_formatPhp(totals.totalAmount - var_customerCashAmount)} more.`);
    var_customerCashAmount = 0;
    var_customerChangeAmount = 0;
    func_updateSummary();
    return;
  }

  if (!confirm("Proceed with purchasing the items?")) return;

  // finalize
  var_customerChangeAmount = var_customerCashAmount - totals.totalAmount;
  const purchasedDescriptions = cartItems.map(item => `${item.var_name} x${item.var_quantity}`);
  const timestamp = new Date().toLocaleString();
  var_purchaseLogs.push(`${timestamp} - Items: ${purchasedDescriptions.join(", ")} - Total: ${func_formatPhp(totals.totalAmount)} - Cash: ${func_formatPhp(var_customerCashAmount)} - Change: ${func_formatPhp(var_customerChangeAmount)}`);

  // deduct stock and clear quantities
  var_inventoryItems.forEach(item => {
    if (item.var_quantity >= 1) {
      item.var_stock = Math.max(0, item.var_stock - item.var_quantity);
      item.var_quantity = 0;
    }
  });

  alert("Thank you!");
  // reset cash/change
  var_customerCashAmount = 0;
  var_customerChangeAmount = 0;
  func_renderCheckout();
  func_renderInventory();
  if (var_viewingLogs === 1) func_renderLogsView();
}

function func_renderInventory() {
  // Process:
  // 1. Clear inventory container.
  // 2. For each item, create a slot button showing IID, name, stock (or Out of stock), price.
  // 3. Set image background via tryImageExtensionsSetBackground.
  // 4. Attach click handler to add item to cart (increment quantity) respecting stock.
  const inventoryContainer = func_querySelector("#div-inventory");
  if (!inventoryContainer) return;
  inventoryContainer.innerHTML = "";
  var_inventoryItems.forEach((item, index) => {
    const slot = document.createElement("button");
    slot.className = "div-inventory_slot";
    slot.dataset.index = index;
    if (item.var_stock === 0 && item.var_quantity === 0) slot.disabled = true;
    const stockText = item.var_stock === 0 ? "Out of stock" : `${item.var_stock} in stock`;
    slot.innerHTML = `
      <div class="div-item_frame">
        <div class="div-item_image" aria-hidden="true">
          <p class="div-item_id">IID ${item.var_iid}</p>
          ${item.var_quantity >= 1 ? `<p class="div-item_status">LISTED</p>` : ""}
          <p class="div-item_name">${item.var_name}</p>
          <p class="div-item_stock">${stockText}</p>
        </div>
      </div>
      <p class="div-item_price">${func_formatPhp(item.var_price)}</p>
    `;
    inventoryContainer.appendChild(slot);
    const imageContainer = slot.querySelector(".div-item_image");
    if (imageContainer) func_tryImageExtensionsSetBackground(imageContainer, item.var_imageBase || func_imageBasePathForIID(item.var_iid));
  });

  inventoryContainer.onclick = event => {
    const slotButton = event.target.closest(".div-inventory_slot");
    if (!slotButton) return;
    const itemIndex = Number(slotButton.dataset.index);
    const item = var_inventoryItems[itemIndex];
    if (!item) return;
    if (item.var_stock <= 0 && item.var_quantity === 0) { alert("Item out of stock."); return; }
    if (item.var_quantity < item.var_stock) item.var_quantity++;
    else alert("Reached maximum stock for this item.");
    func_refreshUI();
  };
}

function func_renderLogsView() {
  // Process:
  // 1. Render purchase logs list or placeholder when empty.
  const logsContainer = func_querySelector("#div-view_logs");
  if (!logsContainer) return;
  logsContainer.innerHTML = "";
  if (!var_purchaseLogs.length) { logsContainer.innerHTML = "<p>No logs yet.</p>"; return; }
  const listElement = document.createElement("ul");
  var_purchaseLogs.forEach((logEntry, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${index + 1}. ${logEntry}`;
    listElement.appendChild(listItem);
  });
  logsContainer.appendChild(listElement);
}

function func_getCheckoutHTML() {
  // Returns static checkout HTML with "No Inputs" placeholders
  return `
    CHECKOUT
    <button class="div-clear_list">CLEAR</button>
    <div id="div-list"></div>
    <div id="div-list_summary">
      <div class="div-list_percentage_value">
        <p>Subtotal</p>
        <p id="div-discount_percentage_value">Discount: ${var_discountPercentage}%</p>
        <p id="div-tax_percentage_value">Tax: ${var_taxPercentage}%</p>
        <p>Total Amount</p>
        <p>Customer Cash</p>
        <p>Customer Change</p>
      </div>
      <div class="div-list_amount_value">
        <p id="div-subtotal_value">No Inputs</p>
        <p id="div-discount_value">No Inputs</p>
        <p id="div-tax_value">No Inputs</p>
        <p id="div-total_amount_value">No Inputs</p>
        <p id="div-customer_cash_value">No Inputs</p>
        <p id="div-customer_change_value">No Inputs</p>
      </div>
    </div>
    <button class="div-purchase_button">PURCHASE</button>
  `;
}

function func_renderCheckout() {
  // Process:
  // 1. If viewing logs, render logs view.
  // 2. Otherwise render checkout HTML, wire purchase and clear buttons, and update state.
  const checkoutContainer = func_querySelector("#div-checkout");
  if (!checkoutContainer) return;
  if (var_viewingLogs === 1) {
    checkoutContainer.innerHTML = `
      CHECKOUT
      <button class="div-exit_logs">EXIT LOGS</button>
      <div id="div-view_logs"></div>
    `;
    const exitButton = func_querySelector(".div-exit_logs");
    if (exitButton) exitButton.onclick = () => { var_viewingLogs = 0; func_renderCheckout(); };
    func_renderLogsView();
    return;
  }
  checkoutContainer.innerHTML = func_getCheckoutHTML();
  func_renderCheckoutItems();
  const purchaseButton = checkoutContainer.querySelector(".div-purchase_button");
  if (purchaseButton) purchaseButton.onclick = func_handlePurchase;
  const clearButton = checkoutContainer.querySelector(".div-clear_list");
  if (clearButton) clearButton.onclick = () => {
    var_inventoryItems.forEach(item => item.var_quantity = 0);
    var_customerCashAmount = 0;
    var_customerChangeAmount = 0;
    func_renderCheckout();
    func_renderInventory();
  };
  func_updateButtonsState();
}

function func_hideAdminButtons() {
  const selectors = [".div-set_tax", ".div-set_discount", ".div-add_item", ".div-edit_item", ".div-remove_item", ".div-logs", ".div-logout"];
  selectors.forEach(selector => { const el = func_querySelector(selector); if (el) el.style.display = "none"; });
  return selectors;
}
function func_showAdminButtons(buttonSelectors) { buttonSelectors.forEach(selector => { const el = func_querySelector(selector); if (el) el.style.display = "inline-block"; }); }

function func_enableAdminMode(settingsButton, buttonsToShow) {
  // Process:
  // 1. Enable dev mode, show admin buttons, wire admin actions (discount, tax, add, edit, remove, logs, logout).
  var_developerUser = 1;
  if (settingsButton) settingsButton.disabled = true;
  func_showAdminButtons(buttonsToShow);
  const discountButton = func_querySelector(".div-set_discount");
  const taxButton = func_querySelector(".div-set_tax");
  const addButton = func_querySelector(".div-add_item");
  const editButton = func_querySelector(".div-edit_item");
  const removeButton = func_querySelector(".div-remove_item");
  const logsButton = func_querySelector(".div-logs");
  const logoutButton = func_querySelector(".div-logout");

  if (discountButton) discountButton.onclick = () => {
    const raw = prompt("Enter discount percentage:");
    if (raw !== null && !isNaN(raw)) { var_discountPercentage = Math.max(0, parseFloat(raw)); func_updateSummary(); func_updateButtonsState(); }
  };
  if (taxButton) taxButton.onclick = () => {
    const raw = prompt("Enter tax percentage:");
    if (raw !== null && !isNaN(raw)) { var_taxPercentage = Math.max(0, parseFloat(raw)); func_updateSummary(); func_updateButtonsState(); }
  };
  if (addButton) addButton.onclick = func_addNewItem;
  if (removeButton) removeButton.onclick = func_removeItemByIID;
  if (editButton) editButton.onclick = func_editItemByIID;
  if (logsButton) logsButton.onclick = () => { var_viewingLogs = 1; func_renderCheckout(); };
  if (logoutButton) logoutButton.onclick = () => { if (confirm("Do you want to logout?")) func_disableAdminMode(settingsButton, buttonsToShow); };
}

function func_disableAdminMode(settingsButton, buttonsToHide) {
  // Process:
  // 1. Disable dev mode, hide admin buttons, reset percentages, re-render UI.
  var_developerUser = 0;
  var_viewingLogs = 0;
  if (settingsButton) settingsButton.disabled = false;
  func_hideAdminButtons();
  var_discountPercentage = 0;
  var_taxPercentage = 0;
  func_renderCheckout();
  func_renderInventory();
}

function func_setupButtons() {
  // Process:
  // 1. Hide admin buttons initially.
  // 2. Wire settings button to prompt for admin code and enable admin mode.
  const settingsButton = func_querySelector(".div-settings");
  const hiddenButtons = func_hideAdminButtons();
  if (!settingsButton) return;
  settingsButton.onclick = () => {
    if (var_developerUser !== 1) {
      const code = prompt("Enter admin code:");
      if (code === "admin1234") func_enableAdminMode(settingsButton, hiddenButtons);
      else alert("Access denied. Incorrect code.");
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  func_assignInventoryIds();
  func_renderCheckout();
  func_renderInventory();
  func_setupButtons();
});
