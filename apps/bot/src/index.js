const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const { config } = require('./config');
const { loadMenuData } = require('./lib/menuStore');
const { normalizeOrderPayload } = require('./lib/validateOrder');
const { formatCustomerConfirmation, formatStaffKitchenSummary, formatOrderStatus } = require('./lib/formatters');
const { loadCustomers, saveCustomers, loadOrders, saveOrders, getOrCreateCustomer } = require('./lib/stateStore');
const { updateHeatProfileOnCompletedPaid } = require('./lib/heatEngine');
const { canActOnStaffOrder, isStaff } = require('./lib/auth');

const bot = new TelegramBot(config.botToken, { polling: true });
const menuData = loadMenuData();
let CUSTOMERS = loadCustomers();
let ORDERS = loadOrders();

function newOrderId() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g, '');
  return `WB-${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function miniAppKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: 'Open WingBoss Direct', web_app: { url: config.miniAppUrl } }]],
    },
  };
}

function staffOrderKeyboard(orderId) {
  return {
    inline_keyboard: [
      [
        { text: 'Confirmed / Paid', callback_data: `order:${orderId}:confirmed_paid` },
        { text: 'Need Info', callback_data: `order:${orderId}:need_info` },
      ],
      [
        { text: 'Cooking', callback_data: `order:${orderId}:cooking` },
        { text: 'Ready', callback_data: `order:${orderId}:ready` },
      ],
      [
        { text: 'Completed', callback_data: `order:${orderId}:completed` },
        { text: 'Cancelled', callback_data: `order:${orderId}:cancelled` },
      ],
      [
        { text: 'Refunded', callback_data: `order:${orderId}:refunded` },
      ],
    ],
  };
}

bot.onText(/^\/start/, async (msg) => {
  getOrCreateCustomer(CUSTOMERS, msg.from);
  saveCustomers(CUSTOMERS);
  await bot.sendMessage(
    msg.chat.id,
    'Welcome to Wing⚡Boss Direct. Open the Mini App to order direct in Telegram.',
    miniAppKeyboard()
  );
});

bot.onText(/^\/menu/, async (msg) => {
  await bot.sendMessage(msg.chat.id, 'Open WingBoss Direct:', miniAppKeyboard());
});

bot.onText(/^\/staff/, async (msg) => {
  if (!isStaff(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  await bot.sendMessage(msg.chat.id, 'Staff mode: order buttons in the staff group update status. Heat Points are awarded only after Confirmed/Paid + Completed and not Refunded.');
});

bot.on('message', async (msg) => {
  try {
    if (!msg.web_app_data || !msg.web_app_data.data) return;
    const raw = JSON.parse(msg.web_app_data.data);
    const normalized = normalizeOrderPayload(raw, msg.from, menuData);
    const orderId = newOrderId();
    const order = {
      ...normalized,
      orderId,
      status: normalized.validation.isValid ? 'submitted' : 'staff_review',
      paymentStatus: 'unconfirmed',
      fulfillmentStatus: 'not_started',
      refunded: false,
      staffMessage: null,
      lifecycle: [{ at: new Date().toISOString(), event: 'submitted' }],
    };

    CUSTOMERS = loadCustomers();
    ORDERS = loadOrders();
    const customer = getOrCreateCustomer(CUSTOMERS, msg.from);
    customer.lastOrderId = orderId;
    saveCustomers(CUSTOMERS);

    ORDERS[orderId] = order;
    saveOrders(ORDERS);

    await bot.sendMessage(msg.chat.id, formatCustomerConfirmation(order));
    const staffMsg = await bot.sendMessage(config.staffGroupId, formatStaffKitchenSummary(order, menuData.heatSystem), {
      reply_markup: staffOrderKeyboard(orderId),
      disable_web_page_preview: true,
    });
    order.staffMessage = { chatId: config.staffGroupId, messageId: staffMsg.message_id };
    ORDERS[orderId] = order;
    saveOrders(ORDERS);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `Order could not be processed: ${err.message}`);
  }
});

bot.on('callback_query', async (q) => {
  const msg = q.message;
  if (!msg || !q.data) return;
  if (!q.data.startsWith('order:')) return;

  const [, orderId, action] = q.data.split(':');
  if (!canActOnStaffOrder(q.from.id, msg.chat.id)) {
    await bot.answerCallbackQuery(q.id, { text: 'Not authorized.' });
    return;
  }

  ORDERS = loadOrders();
  CUSTOMERS = loadCustomers();
  const order = ORDERS[orderId];
  if (!order) {
    await bot.answerCallbackQuery(q.id, { text: 'Order not found.' });
    return;
  }

  applyOrderAction(order, action, q.from.id);
  ORDERS[orderId] = order;

  // Heat Economy lock: points awarded only after paid + completed + not refunded.
  const customer = CUSTOMERS[String(order.telegramUser.id)];
  if (customer && canAwardHeat(order)) {
    if (!order.heat.pointsAwardedAt) {
      const earned = updateHeatProfileOnCompletedPaid(customer, order, menuData.heatSystem);
      order.heat.pointsAwardedAt = new Date().toISOString();
      order.heat.pointsAwarded = earned.earnedPoints;
      order.lifecycle.push({ at: new Date().toISOString(), event: 'heat_points_awarded', points: earned.earnedPoints });
      customer.ordersCompleted = Number(customer.ordersCompleted || 0) + 1;
      if (typeof order.pricing.total === 'number') customer.lifetimeSpendUsd = Number((Number(customer.lifetimeSpendUsd || 0) + order.pricing.total).toFixed(2));
      await bot.sendMessage(order.telegramUser.id, `🔥 Heat Points earned: ${earned.earnedPoints}\nAvailable Heat Points: ${customer.heatProfile.heat_points_available}`);
    }
  }

  saveOrders(ORDERS);
  saveCustomers(CUSTOMERS);

  const newText = formatStaffKitchenSummary(order, menuData.heatSystem);
  await bot.editMessageText(newText, {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    reply_markup: staffOrderKeyboard(orderId),
    disable_web_page_preview: true,
  });
  await bot.answerCallbackQuery(q.id, { text: formatOrderStatus(order) });

  if (['confirmed_paid','need_info','ready','cancelled','refunded'].includes(action)) {
    await notifyCustomerForAction(order, action);
  }
});

function applyOrderAction(order, action, actorId) {
  const now = new Date().toISOString();
  order.lifecycle = Array.isArray(order.lifecycle) ? order.lifecycle : [];
  order.lifecycle.push({ at: now, event: action, actorId });

  if (action === 'confirmed_paid') {
    order.status = 'confirmed_paid';
    order.paymentStatus = 'paid';
  } else if (action === 'need_info') {
    order.status = 'need_info';
  } else if (action === 'cooking') {
    order.status = 'cooking';
    order.fulfillmentStatus = 'cooking';
  } else if (action === 'ready') {
    order.status = 'ready';
    order.fulfillmentStatus = 'ready';
  } else if (action === 'completed') {
    order.status = 'completed';
    order.fulfillmentStatus = 'completed';
  } else if (action === 'cancelled') {
    order.status = 'cancelled';
    order.fulfillmentStatus = 'cancelled';
  } else if (action === 'refunded') {
    order.status = 'refunded';
    order.refunded = true;
    order.fulfillmentStatus = 'refunded';
  }
}

function canAwardHeat(order) {
  return order.paymentStatus === 'paid' && order.fulfillmentStatus === 'completed' && order.refunded !== true;
}

async function notifyCustomerForAction(order, action) {
  const userId = order.telegramUser.id;
  if (!userId) return;
  const map = {
    confirmed_paid: `Wing⚡Boss order ${order.orderId} confirmed.`,
    need_info: `Wing⚡Boss order ${order.orderId}: staff needs to confirm something before cooking.`,
    ready: `Wing⚡Boss order ${order.orderId} is ready.`,
    cancelled: `Wing⚡Boss order ${order.orderId} was cancelled.`,
    refunded: `Wing⚡Boss order ${order.orderId} was marked refunded.`,
  };
  if (map[action]) await bot.sendMessage(userId, map[action]);
}

console.log(`WingBoss Phase 5 bot backend running. TZ=${config.timezone}`);
