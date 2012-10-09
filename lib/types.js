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
exports.Relation = function() {
	var options;
	if(arguments.length == 1) options = {
		column: arguments[0], outbound: true
	};
	else if(arguments.length == 2) options = {
		table: arguments[0], column: arguments[1], outbound: false
	};
	else if(arguments.length == 3) options = {
		table: arguments[0], column: arguments[1],
		relation: arguments[2], outbound: false
	};
	return { name: "relation", options: options };
}