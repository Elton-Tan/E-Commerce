const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const contactTickets = db.define('tickets',
{
    subject:{
        type:Sequelize.STRING
    },
    message:{
        type:Sequelize.TEXT
    },
    
    ticket_no:{
        type:Sequelize.TEXT
    },
    
    added_by:{
        type:Sequelize.TEXT
    },
    user_id:{
        type:Sequelize.INTEGER,
        references:{
            model:'users',
            key:'id'
        }
    }
    
});

module.exports = contactTickets;