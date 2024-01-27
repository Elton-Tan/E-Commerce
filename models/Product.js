const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Product = db.define('product', {
	Brand: {
		type: Sequelize.STRING
	},
	Name: {
		type: Sequelize.STRING
	},
	Stock: {
		type: Sequelize.STRING
	},
	posterUpload: {
		type: Sequelize.STRING
	},
	posterUpload2: {
		type: Sequelize.STRING
	},
	posterUpload3: {
		type: Sequelize.STRING
	},
	Colour: {
		type: Sequelize.STRING
	},

	Storage: {
		type: Sequelize.STRING,
	},
	Price: {
		type: Sequelize.STRING
	},
	Description: {
		type: Sequelize.STRING(2000)
	},
	Popularity: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

module.exports = Product;