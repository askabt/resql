// ResQL API

var Database = require("./Database");

exports.connect = function (options) {
	return new Database(options);
}

exports.Boolean = { type: "boolean" };
exports.Integer = function (size) { return { type: "integer", size: size }; };
exports.Float   = function (size) { return { type: "float",   size: size }; };
exports.String  = function (size) { return { type: "string",  size: size }; };
exports.Text    = { type: "text" };
exports.Date    = { type: "date" };
exports.Serial  = { type: "date" };
exports.Foreign = function (table) {
	if(!table) throw "Can't create foreign key without table reference!";
	table = (typeof table === "string"? table: table.name);
	return { type: "foreign", table: table };
};
