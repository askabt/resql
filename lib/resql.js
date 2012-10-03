// ResQL API

var api = require("./types");
var Database = require("./Database");

api.connect = function (options) {
	return new Database(options);
}

module.exports = api;