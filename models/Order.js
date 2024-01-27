const Sequelize = require('sequelize');
const sequelize = require('../config/DBConfig');
const db = require('../config/DBConfig');

const Order = db.define('Order', {
  order_id: {
    type: Sequelize.TEXT,
  },
  order_price: {
    type: Sequelize.STRING,
  },
  order_products: {
    type: Sequelize.TEXT,
  },
  order_email: {
    type: Sequelize.STRING,
  },
  order_address: {
    type: Sequelize.TEXT,
  },
  order_date: {
    type: Sequelize.STRING,
  },
  order_user_id: {
    type: Sequelize.INTEGER,
  },
  DiscountPrice: {
    type: Sequelize.FLOAT,
    defaultValue: 0
  },
  TotalPrice: {
    type: Sequelize.FLOAT,
  },
  IsDelivered: {
    type: Sequelize.BOOLEAN,
    defaultValue: 0
  },
  IsCanceled: {
    type: Sequelize.BOOLEAN,
    defaultValue: 0
  },
  Reason: {
    type: Sequelize.TEXT,

  },
  paymentmethod:{
    type:Sequelize.STRING,
  }
});

module.exports = Order;

