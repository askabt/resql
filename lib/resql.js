// ResQL API

var api = require("./types.js"),
	Database = require("./Database.js"),
	defer = require("./defer.js");

api.connect = function (options) {
	return new Database(options);
};

api.defer = defer;

module.exports = api;