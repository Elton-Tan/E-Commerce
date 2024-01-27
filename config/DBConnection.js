const mySQLDB = require('./DBConfig');
const user = require('../models/User');
const admin = require('../models/Admin');

 
const setUpDB = (drop) => { 
    mySQLDB.authenticate() 
        .then(() => { 
            console.log('Database Connected'); 
        }) 
        .then(() => {
           
            mySQLDB.sync({ force: drop}).then(() => { 
                console.log('Create tables if none exists') 
            }).catch(err => console.log(err)) 
        }) 
        .catch(err => console.log('Error: ' + err)); 
};

const getDbConnectionInstance = () =>{

    return mySQLDB.connectionManager.getConnection();

}   
 
module.exports = { setUpDB,getDbConnectionInstance }; 