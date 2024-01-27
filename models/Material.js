const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Materiall = db.define('material',
    {

        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        Name: {
            type: Sequelize.STRING
        },
        'Material Class': {
            type: Sequelize.STRING
        },
        ExtraPrice: {
            type: Sequelize.INTEGER
        },
        Popularity: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        Qunatity: {
            type: Sequelize.INTEGER
        },
    }, {
    tableName: 'material',
    timestamps: false
});

module.exports = Materiall;