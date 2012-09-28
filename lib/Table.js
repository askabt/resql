var Row = require("./Row"),
	Column = require("./Column"),
	Relation = require("./Relation"),
	Query = require("./Query");

module.exports = Table;

function Table(database, name, schema) {
	var i, t;
	
	if(arguments.length == 1) {
		t = database;
		this.name = t.name;
		this.schema = t.schema;
		return;
	}
	
	if(!schema) schema = {};
	
	this.name = name;
	this.schema = {};
	for(i in schema) {
		this.column(i, schema[i]);
	}
	this.query = new Query(database);
	this.query.table = name;
};

Table.prototype.one = function (filters, options) {
	var ret = new Row(this);
	ret.query.verb = "select";
	ret.query.filters = filters;
//	ret.query.options = options;
	return ret;
};

Table.prototype.all = function (filters, options) {
	var ret = new Table(this);
	ret.query.verb = "select";
	ret.query.filters = filters || {};
//	ret.query.options = options || {};
	return ret;
};

Table.prototype.add = function (row) {
	var ret = new Table(this);
	ret.query.verb = "insert";
	ret.query.data = row;
}

Table.prototype.del = function (filters) {
	var ret = new Table(this);
	ret.query.verb = "delete";
	ret.query.filters = filters;
}

Table.prototype.column = function(name, type) {
	var relname = "";
	
	if(typeof type === "function") type = type(); // optional parameterization
	
	if(type && type.type === "foreign") {
		if(name.substr(-2) === "Id") {
			relname = name.substr(0, name.length - 2);
		} else if(name.substr(-3) === "_id") {
			relname = name.substr(0, name.length - 3);
		}
		
		if(relname) this.relation(relname, {
			table: type.table, column: name, outbound: true
		});
	}
	
	return this.schema[name] = new Column(this, name, type);
}

Table.prototype.relation = function(name, options) {
	return this.schema[name] = new Relation(this, name, options);
}

Table.prototype.then = function(callback, errback) {
	return this.query.execute().then(callback, errback);
}