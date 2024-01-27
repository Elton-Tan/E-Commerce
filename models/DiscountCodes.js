const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const DiscountCodes = db.define('discountcodes',
    {
        UserID: {
            type: Sequelize.INTEGER
        },
        DiscountCode: {
            type: Sequelize.CHAR(5),
            primaryKey: true
        },
        IsClaimed: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        },
    }, {
    tableName: 'discountcodes',
    timestamps: false
});

module.exports = DiscountCodes;