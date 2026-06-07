const { config } = require('../config');

function isOwner(userId) {
  return Number(userId) === Number(config.ownerTelegramId);
}

function isStaff(userId) {
  return isOwner(userId) || config.staffTelegramIds.includes(Number(userId));
}

function canActOnStaffOrder(userId, chatId) {
  return isOwner(userId) || (Number(chatId) === Number(config.staffGroupId) && isStaff(userId));
}

module.exports = { isOwner, isStaff, canActOnStaffOrder };
