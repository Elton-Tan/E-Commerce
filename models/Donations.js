const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Donations = db.define('donations',
    {

        Quantity: {
            type: Sequelize.INTEGER
        },
        Material: {
            type: Sequelize.STRING(100)
        },
        CustomerID: {
            type: Sequelize.INTEGER
        },
        CustomerEmail: {
            type: Sequelize.STRING(200)
        },
        Images: {
            type: Sequelize.STRING(500)
        },
        IsReceived: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        },
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        Username: {
            type: Sequelize.STRING(100)
        }
    }, {
    tableName: 'donations',
    timestamps: false
});

module.exports = Donations;