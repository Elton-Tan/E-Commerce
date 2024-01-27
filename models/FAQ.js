const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const FAQ = db.define('FAQ',
{
    
    question:{
        type:Sequelize.STRING,
    },
    answer:{
        type:Sequelize.STRING
    }
});

module.exports = FAQ;