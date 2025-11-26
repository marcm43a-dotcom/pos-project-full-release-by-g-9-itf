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
  if (!element || !basePath) return;
  let var_extensionIndex = 0;
  (function func_tryNextExtension() {
    if (var_extensionIndex >= extensions.length) { element.style.backgroundImage = ""; return; }
    const var_url = `${basePath}.${extensions[var_extensionIndex++]}`;
    const var_image = new Image();
    var_image.onload = () => { element.style.backgroundImage = `url("${var_url}")`; var_image.onload = var_image.onerror = null; };
    var_image.onerror = () => { var_image.onload = var_image.onerror = null; func_tryNextExtension(); };
    var_image.src = var_url;
  })();
}

const func_imageBasePathForIID = iid => `assets/iid_image/${iid}`;

function func_assignInventoryIds() {
  var_inventoryItems.forEach((item, index) => {
    const var_iid = index + 1;
    item.var_iid = var_iid;
    item.var_imageBase = item.var_imageBase || func_imageBasePathForIID(var_iid);
    item.var_name = item.var_name || `Item ${var_iid}`;
    item.var_price = Number(item.var_price || 0);
    item.var_stock = Number(item.var_stock || 0);
    item.var_quantity = Number(item.var_quantity || 0);
  });
}

function func_addNewItem() {
  const var_newIid = var_inventoryItems.length + 1;
  var_inventoryItems.push({
    var_iid: var_newIid,
    var_name: `Item ${var_newIid}`,
    var_price: 1,
    var_stock: 1,
    var_quantity: 0,
    var_imageBase: func_imageBasePathForIID(var_newIid)
  });
  func_assignInventoryIds();
  func_refreshUI();
}

function func_removeItemByIID() {
  let var_parsedIid;
  while (true) {
    const var_raw = prompt("Enter IID of the item to remove:");
    if (var_raw === null) return;
    var_parsedIid = parseInt(var_raw, 10);
    if (!isNaN(var_parsedIid) && var_parsedIid >= 1 && var_parsedIid <= var_inventoryItems.length) break;
    alert("Invalid IID. Try again or Cancel to exit.");
  }
  const var_removeIndex = var_parsedIid - 1;
  const var_itemToRemove = var_inventoryItems[var_removeIndex];
  if (!confirm(`Remove IID ${var_parsedIid} - "${var_itemToRemove.var_name}"?`)) return;
  var_inventoryItems.splice(var_removeIndex, 1);
  func_assignInventoryIds();
  func_refreshUI();
  alert(`Item IID ${var_parsedIid} removed.`);
}

function func_editItemByIID() {
  let var_parsedIid;
  while (true) {
    const var_raw = prompt("Enter IID of the item to edit:");
    if (var_raw === null) return;
    var_parsedIid = parseInt(var_raw, 10);
    if (!isNaN(var_parsedIid) && var_parsedIid >= 1 && var_parsedIid <= var_inventoryItems.length) break;
    alert("Invalid IID. Try again or Cancel to exit.");
  }
  const var_item = var_inventoryItems[var_parsedIid - 1];

  let var_chosenField;
  while (true) {
    const var_fieldRaw = prompt("Which field to edit? Enter: name, stock, price");
    if (var_fieldRaw === null) return;
    var_chosenField = var_fieldRaw.trim().toLowerCase();
    if (["name", "stock", "price"].includes(var_chosenField)) break;
    alert("Invalid choice. Use name, stock, or price.");
  }

  while (true) {
    const var_currentValue = var_chosenField === "name" ? var_item.var_name : var_chosenField === "stock" ? var_item.var_stock : var_item.var_price;
    const var_newValueRaw = prompt(`Enter new value for ${var_chosenField} (current: ${var_currentValue}):`);
    if (var_newValueRaw === null) return;

    if (var_chosenField === "name") {
      const var_newName = var_newValueRaw.trim();
      if (!var_newName) { alert("Name cannot be empty."); continue; }
      if (!confirm(`Change name from "${var_item.var_name}" to "${var_newName}"?`)) { alert("Change cancelled."); continue; }
      var_item.var_name = var_newName;
      break;
    }

    if (var_chosenField === "stock") {
      const var_newStock = parseInt(var_newValueRaw, 10);
      if (isNaN(var_newStock) || var_newStock < 0) { alert("Stock must be a non-negative integer."); continue; }
      if (!confirm(`Change stock from ${var_item.var_stock} to ${var_newStock}?`)) { alert("Change cancelled."); continue; }
      var_item.var_stock = var_newStock;
      if (var_item.var_quantity > var_newStock) var_item.var_quantity = var_newStock;
      break;
    }

    const var_newPrice = parseFloat(var_newValueRaw);
    if (isNaN(var_newPrice) || var_newPrice < 0) { alert("Price must be a non-negative number."); continue; }
    if (!confirm(`Change price from ${func_formatPhp(var_item.var_price)} to ${func_formatPhp(var_newPrice)}?`)) { alert("Change cancelled."); continue; }
    var_item.var_price = var_newPrice;
    break;
  }

  func_refreshUI();
  alert(`Item IID ${var_parsedIid} updated.`);
}

function func_calculateTotals() {
  const var_subtotal = var_inventoryItems.reduce((sum, item) => sum + (item.var_quantity >= 1 ? item.var_price * item.var_quantity : 0), 0);
  const var_discountAmount = var_subtotal * (var_discountPercentage / 100);
  const var_afterDiscount = var_subtotal - var_discountAmount;
  const var_taxAmount = var_afterDiscount * (var_taxPercentage / 100);
  const var_totalAmount = var_afterDiscount + var_taxAmount;
  return { subtotal: var_subtotal, discountAmount: var_discountAmount, afterDiscount: var_afterDiscount, taxAmount: var_taxAmount, totalAmount: var_totalAmount };
}

function func_displayOrNoInput(value) {
  if (value === 0) return "Php 0.00";
  return func_formatPhp(value);
}

function func_updateSummary() {
  const var_totals = func_calculateTotals();
  const func_setText = (selector, text) => { const el = func_querySelector(selector); if (el) el.textContent = text; };
  func_setText("#div-subtotal_value", func_displayOrNoInput(var_totals.subtotal));
  func_setText("#div-discount_value", func_displayOrNoInput(var_totals.discountAmount));
  func_setText("#div-tax_value", func_displayOrNoInput(var_totals.taxAmount));
  func_setText("#div-total_amount_value", func_displayOrNoInput(var_totals.totalAmount));
  func_setText("#div-customer_cash_value", func_displayOrNoInput(var_customerCashAmount));
  func_setText("#div-customer_change_value", func_displayOrNoInput(var_customerChangeAmount));
  func_setText("#div-discount_percentage_value", `Discount: ${var_discountPercentage}%`);
  func_setText("#div-tax_percentage_value", `Tax: ${var_taxPercentage}%`);
}

function func_updateButtonsState() {
  const var_checkoutContainer = func_querySelector("#div-checkout");
  if (!var_checkoutContainer) return;
  const var_purchaseButton = var_checkoutContainer.querySelector(".div-purchase_button");
  const var_clearButton = var_checkoutContainer.querySelector(".div-clear_list");
  const var_cartCount = var_inventoryItems.reduce((acc, item) => acc + (item.var_quantity >= 1 ? item.var_quantity : 0), 0);
  if (var_purchaseButton) var_purchaseButton.disabled = var_cartCount === 0;
  if (var_clearButton) var_clearButton.disabled = var_cartCount === 0;
}

function func_refreshUI() {
  func_renderCheckoutItems();
  func_updateSummary();
  func_updateButtonsState();
  func_renderInventory();
}

function func_renderCheckoutItems() {
  const var_listContainer = func_querySelector("#div-list");
  if (!var_listContainer) return;
  var_listContainer.innerHTML = "";
  var_inventoryItems.forEach((item, index) => {
    if (item.var_quantity >= 1) {
      const var_row = document.createElement("div");
      var_row.className = "div-listed_item";
      var_row.dataset.index = index;
      var_row.innerHTML = `
        <p class="div-listed_item_name">${item.var_name}</p>
        <button class="div-listed_item_add_quantity">+</button>
        <p class="div-listed_item_quantity_value">${item.var_quantity}</p>
        <button class="div-listed_item_subtract_quantity">-</button>
        <p class="div-listed_item_price">${func_formatPhp(item.var_price * item.var_quantity)}</p>
      `;
      var_listContainer.appendChild(var_row);
    }
  });

  var_listContainer.onclick = event => {
    const var_clickedButton = event.target.closest("button");
    if (!var_clickedButton) return;
    const var_parentRow = var_clickedButton.closest(".div-listed_item");
    if (!var_parentRow) return;
    const var_itemIndex = Number(var_parentRow.dataset.index);
    const var_item = var_inventoryItems[var_itemIndex];
    if (!var_item) return;

    if (var_clickedButton.classList.contains("div-listed_item_add_quantity")) {
      if (var_item.var_quantity < var_item.var_stock) var_item.var_quantity++;
      else alert("Reached maximum stock for this item.");
    } else if (var_clickedButton.classList.contains("div-listed_item_subtract_quantity")) {
      if (var_item.var_quantity > 0) var_item.var_quantity--;
    }
    func_refreshUI();
  };
}

function func_handlePurchase() {
  const var_cartItems = var_inventoryItems.filter(item => item.var_quantity >= 1);
  if (!var_cartItems.length) { alert("No items in cart to purchase."); return; }

  const var_totals = func_calculateTotals();

  if (!var_customerCashAmount || var_customerCashAmount <= 0) {
    while (true) {
      const var_raw = prompt(`Enter customer cash amount (must be at least ${func_formatPhp(var_totals.totalAmount)}):`);
      if (var_raw === null) return;
      const var_parsedCash = parseFloat(var_raw);
      if (isNaN(var_parsedCash) || var_parsedCash < 0) { alert("Invalid cash amount. Enter a non-negative number."); continue; }
      if (var_parsedCash < var_totals.totalAmount) { alert(`Cash must be at least ${func_formatPhp(var_totals.totalAmount)}. Enter sufficient amount or Cancel.`); continue; }
      var_customerCashAmount = var_parsedCash;
      var_customerChangeAmount = Math.max(0, var_customerCashAmount - var_totals.totalAmount);
      func_updateSummary();
      alert("Cash recorded. Press PURCHASE again to proceed.");
      return;
    }
  }

  if (var_customerCashAmount < var_totals.totalAmount) {
    alert(`Recorded cash is now insufficient. Need ${func_formatPhp(var_totals.totalAmount - var_customerCashAmount)} more.`);
    var_customerCashAmount = 0;
    var_customerChangeAmount = 0;
    func_updateSummary();
    return;
  }

  if (!confirm("Proceed with purchasing the items?")) return;

  var_customerChangeAmount = var_customerCashAmount - var_totals.totalAmount;

  const var_purchasedDescriptions = var_cartItems.map(item => `${item.var_name} x${item.var_quantity}`);
  const var_timestamp = new Date().toLocaleString();
  var_purchaseLogs.push(`${var_timestamp} - Items: ${var_purchasedDescriptions.join(", ")} - Total: ${func_formatPhp(var_totals.totalAmount)} - Cash: ${func_formatPhp(var_customerCashAmount)} - Change: ${func_formatPhp(var_customerChangeAmount)}`);

  var_inventoryItems.forEach(item => {
    if (item.var_quantity >= 1) {
      item.var_stock = Math.max(0, item.var_stock - item.var_quantity);
      item.var_quantity = 0;
    }
  });

  alert("Thank you!");
  var_customerCashAmount = 0;
  var_customerChangeAmount = 0;
  func_renderCheckout();
  func_renderInventory();
  if (var_viewingLogs === 1) func_renderLogsView();
}

function func_renderInventory() {
  const var_inventoryContainer = func_querySelector("#div-inventory");
  if (!var_inventoryContainer) return;
  var_inventoryContainer.innerHTML = "";
  var_inventoryItems.forEach((item, index) => {
    const var_slot = document.createElement("button");
    var_slot.className = "div-inventory_slot";
    var_slot.dataset.index = index;
    if (item.var_stock === 0 && item.var_quantity === 0) var_slot.disabled = true;
    const var_stockText = item.var_stock === 0 ? "Out of stock" : `${item.var_stock} in stock`;
    var_slot.innerHTML = `
      <div class="div-item_frame">
        <div class="div-item_image" aria-hidden="true">
          <p class="div-item_id">IID ${item.var_iid}</p>
          ${item.var_quantity >= 1 ? `<p class="div-item_status">LISTED</p>` : ""}
          <p class="div-item_name">${item.var_name}</p>
          <p class="div-item_stock">${var_stockText}</p>
        </div>
      </div>
      <p class="div-item_price">${func_formatPhp(item.var_price)}</p>
    `;
    var_inventoryContainer.appendChild(var_slot);

    const var_imageContainer = var_slot.querySelector(".div-item_image");
    if (var_imageContainer) func_tryImageExtensionsSetBackground(var_imageContainer, item.var_imageBase || func_imageBasePathForIID(item.var_iid));
  });

  var_inventoryContainer.onclick = event => {
    const var_slotButton = event.target.closest(".div-inventory_slot");
    if (!var_slotButton) return;
    const var_itemIndex = Number(var_slotButton.dataset.index);
    const var_item = var_inventoryItems[var_itemIndex];
    if (!var_item) return;

    if (var_item.var_stock <= 0 && var_item.var_quantity === 0) { alert("Item out of stock."); return; }
    if (var_item.var_quantity < var_item.var_stock) var_item.var_quantity++;
    else alert("Reached maximum stock for this item.");
    func_refreshUI();
  };
}

function func_renderLogsView() {
  const var_logsContainer = func_querySelector("#div-view_logs");
  if (!var_logsContainer) return;
  var_logsContainer.innerHTML = "";
  if (!var_purchaseLogs.length) { var_logsContainer.innerHTML = "<p>No logs yet.</p>"; return; }
  const var_listElement = document.createElement("ul");
  var_purchaseLogs.forEach((logEntry, index) => {
    const var_listItem = document.createElement("li");
    var_listItem.textContent = `${index + 1}. ${logEntry}`;
    var_listElement.appendChild(var_listItem);
  });
  var_logsContainer.appendChild(var_listElement);
}

function func_getCheckoutHTML() {
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
        <p id="div-subtotal_value">Php 0.00</p>
        <p id="div-discount_value">Php 0.00</p>
        <p id="div-tax_value">Php 0.00</p>
        <p id="div-total_amount_value">Php 0.00</p>
        <p id="div-customer_cash_value">Php 0.00</p>
        <p id="div-customer_change_value">Php 0.00</p>
      </div>
    </div>
    <button class="div-purchase_button">PURCHASE</button>
  `;
}

function func_renderCheckout() {
  const var_checkoutContainer = func_querySelector("#div-checkout");
  if (!var_checkoutContainer) return;

  if (var_viewingLogs === 1) {
    var_checkoutContainer.innerHTML = `
      CHECKOUT
      <button class="div-exit_logs">EXIT LOGS</button>
      <div id="div-view_logs"></div>
    `;
    const var_exitButton = func_querySelector(".div-exit_logs");
    if (var_exitButton) var_exitButton.onclick = () => { var_viewingLogs = 0; func_renderCheckout(); };
    func_renderLogsView();
    return;
  }

  var_checkoutContainer.innerHTML = func_getCheckoutHTML();
  func_renderCheckoutItems();

  const var_purchaseButton = var_checkoutContainer.querySelector(".div-purchase_button");
  if (var_purchaseButton) var_purchaseButton.onclick = func_handlePurchase;

  const var_clearButton = var_checkoutContainer.querySelector(".div-clear_list");
  if (var_clearButton) var_clearButton.onclick = () => {
    var_inventoryItems.forEach(item => item.var_quantity = 0);
    var_customerCashAmount = 0;
    var_customerChangeAmount = 0;
    func_renderCheckout();
    func_renderInventory();
  };

  func_updateButtonsState();
}

function func_hideAdminButtons() {
  const var_selectors = [".div-set_tax", ".div-set_discount", ".div-add_item", ".div-edit_item", ".div-remove_item", ".div-logs", ".div-logout"];
  var_selectors.forEach(selector => { const el = func_querySelector(selector); if (el) el.style.display = "none"; });
  return var_selectors;
}

function func_showAdminButtons(buttonSelectors) {
  buttonSelectors.forEach(selector => { const el = func_querySelector(selector); if (el) el.style.display = "inline-block"; });
}

function func_enableAdminMode(settingsButton, buttonsToShow) {
  var_developerUser = 1;
  if (settingsButton) settingsButton.disabled = true;
  func_showAdminButtons(buttonsToShow);

  const var_discountButton = func_querySelector(".div-set_discount");
  const var_taxButton = func_querySelector(".div-set_tax");
  const var_addButton = func_querySelector(".div-add_item");
  const var_editButton = func_querySelector(".div-edit_item");
  const var_removeButton = func_querySelector(".div-remove_item");
  const var_logsButton = func_querySelector(".div-logs");
  const var_logoutButton = func_querySelector(".div-logout");

  if (var_discountButton) var_discountButton.onclick = () => {
    const var_raw = prompt("Enter discount percentage:");
    if (var_raw !== null && !isNaN(var_raw)) { var_discountPercentage = Math.max(0, parseFloat(var_raw)); func_updateSummary(); func_updateButtonsState(); }
  };
  if (var_taxButton) var_taxButton.onclick = () => {
    const var_raw = prompt("Enter tax percentage:");
    if (var_raw !== null && !isNaN(var_raw)) { var_taxPercentage = Math.max(0, parseFloat(var_raw)); func_updateSummary(); func_updateButtonsState(); }
  };
  if (var_addButton) var_addButton.onclick = func_addNewItem;
  if (var_removeButton) var_removeButton.onclick = func_removeItemByIID;
  if (var_editButton) var_editButton.onclick = func_editItemByIID;
  if (var_logsButton) var_logsButton.onclick = () => { var_viewingLogs = 1; func_renderCheckout(); };
  if (var_logoutButton) var_logoutButton.onclick = () => { if (confirm("Do you want to logout?")) func_disableAdminMode(settingsButton, buttonsToShow); };
}

function func_disableAdminMode(settingsButton, buttonsToHide) {
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
  const var_settingsButton = func_querySelector(".div-settings");
  const var_hiddenButtons = func_hideAdminButtons();
  if (!var_settingsButton) return;
  var_settingsButton.onclick = () => {
    if (var_developerUser !== 1) {
      const var_code = prompt("Enter admin code:");
      if (var_code === "admin1234") func_enableAdminMode(var_settingsButton, var_hiddenButtons);
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
