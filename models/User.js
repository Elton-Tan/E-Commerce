const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const User = db.define('user',
    {
        first_name: {
            type: Sequelize.STRING
        },
        last_name: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING,
            unique: true
        },
        password: {
            type: Sequelize.STRING
        },
        date_of_birth: {
            type: Sequelize.STRING
        },
        address: {
            type: Sequelize.STRING
        },
        is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        profile_pic: {
            type: Sequelize.TEXT
        },
        IsDeleted: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        GiveDiscount: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        },
        IsSuspend: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        },
        Reason: {
            type: Sequelize.TEXT,
           
        },

    });

module.exports = User;