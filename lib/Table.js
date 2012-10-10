var Row = require("./Row"),
	Column = require("./Column"),
	Relation = require("./Relation"),
	Query = require("./Query"),
	types = require('./types');

module.exports = Table;

function Table(database, name, schema) {
	var i, t;
	
	if(arguments.length == 1) {
		t = database;
		database = t.query.database;
		name = t.name;
		schema = {};
		for(i in t.schema) {
			schema[i] = t.schema[i].type;
		}
	}
	
	this.name = name;
	this.schema = {};
	this.columns = {};
	this.relations = {};
	this.proto = {};
	
	if(schema) for(i in schema) {
		if(schema[i].name == "relation") {
			if(schema[i].options.outbound)
				schema[i].options.table = schema[schema[i].options.column].table;
			this.relation(i, schema[i].options);
		} else {
			this.column(i, schema[i]);
		}
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

Table.prototype.add = function (data) {
	var ret = new Table(this);
	ret.query.verb = "insert";
	ret.query.data = data;
	
	return ret.query.execute();
}

Table.prototype.del = function (filters) {
	var ret = new Table(this);
	ret.query.verb = "delete";
	ret.query.filters = filters;
	
	return ret.query.execute();
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
	
	return this.schema[name] = this.columns[name] =
		new Column(this, name, type);
}

Table.prototype.relation = function(name, options) {
	return this.schema[name] = this.relations[name] =
		new Relation(this, name, options);
}

Table.prototype.then = function(callback, errback) {
	// TODO: on successful execution, extend the returned value with the
	// appropriate prototype, attach a "save" method etc.
	this.query.verb = "select";
	return this.query.execute().then(callback, errback);
}

Table.prototype.finalize = function() {
	if(!this.schema.id) this.schema.id = this.column("id", types.Serial);
	
	this.column = null;
	this.relation = null;
}