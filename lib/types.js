exports.Boolean = { name: "boolean" };
exports.Integer = { name: "integer" };
exports.Float   = { name: "float" };
exports.String  = function (size) { return { name: "string",  size: size || 255 }; };
exports.Text    = { name: "text" };
exports.Date    = { name: "date" };
exports.Serial  = { name: "serial" };
exports.Foreign = function (table) {
	if(!table) throw "Can't create foreign key without table reference!";
	table = (typeof table === "string"? table: table.name);
	return { name: "foreign", table: table };
};