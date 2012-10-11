// ResQL API

var api = require("./types"),
	Database = require("./Database"),
	defer = require("./defer");

api.connect = function (options) {
	return new Database(options);
};

api.defer = defer;

module.exports = api;