var dialects = require('./dialects.js');

var Type = function(options) {
	for(i in options) this[i] = options[i];
}

Type.prototype.index = function(indexType) {
	var clone = Object.create(this);
	if(indexType && indexType !== "primary" && indexType !== "unique")
		throw "Unknown index type.";
	clone.index = indexType || "index";
	return clone;
}

Type.prototype.configure = function(options) {
	var clone = Object.create(this);
	clone.options = options;
	return clone;
}

Type.prototype.createSql = function(dialect) {
	var sql = dialect.types[this.name] || dialect.types["default"];
	switch (this.index) {
		case "primary":
			sql += "PRIMARY KEY";
			break;
		case "unique":
			sql += "UNIQUE KEY";
			break;
	}
	return sql;
}

exports.Boolean = function() { return new Type({ name: "boolean" }) };
exports.Integer = function() { return new Type({ name: "integer" }) };
exports.Float   = function() { return new Type({ name: "float" }) };
exports.String  = function() { return new Type({ name: "string" }) };
exports.Text    = function() { return new Type({ name: "text" }) };
exports.Date    = function() { return new Type({ name: "date" }) };
exports.Serial  = function() { return new Type({ name: "serial" }) };
exports.Foreign = function (table) {
	if(!table) throw "Can't create foreign key without table reference!";
	table = (typeof table === "string"? table: table.name);
	return new Type({ name: "foreign", table: table });
};

exports.Relation = function() {
	var options;
	if(arguments.length == 1) options = {
		column: arguments[0], outbound: true
	};
	else if(arguments[0]) options = {
		table: arguments[0], column: arguments[1],
		relation: arguments[2], outbound: false
	};
	else options = {
		column: arguments[1], relation: arguments[2], outbound: true
	};
	return new Type({ name: "relation", options: options });
}