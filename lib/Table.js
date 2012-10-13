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
		database = t.database;
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
	this.database = database;
	
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
	
	this.finalize();
};

function attachOptions(query, table, options) {
	var i, joins = {}, refNo = 1;
	
	function join(nestMap, pTab, pRef) {
		var i, res = {}, ref, rel, t;
		
		for(i in nestMap) {
			if(i == "_ref" || i == "_out") continue;
			ref = String.fromCharCode(refNo+65); refNo++;
			rel = pTab.relations[i];
//			console.log(i, pTab.relations);
			joins[ref] = {
				table: rel.targetTable,
				key: rel.targetColumn,
				keyTable: rel.outbound? pRef: ref,
				idTable: rel.outbound? ref: pRef
			};
			
			if(rel.targetRelation) {
				t = {}; t[rel.targetRelation] = nestMap[i];
				join(t, table.database.tables[rel.targetTable], ref);
				if(typeof(nestMap[i]) !== "object") nestMap[i] = {};
				nestMap[i]._ref = ref;
				nestMap[i]._out = rel.outbound &&
					table.database.tables[rel.targetTable].relations[
						rel.targetRelation].outbound;
			}
			else if(typeof nestMap[i] == "object") {
				join(nestMap[i], table.database.tables[rel.targetTable], ref);
				nestMap[i]["_out"] = rel.outbound;
			} else {
				nestMap[i] = { _ref: ref, _out: rel.outbound };
			}
		}
		nestMap["_ref"] = pRef;
		return ref;
	}
	
	if(options.embed) {
		join(options.embed, table, "A");
		query.options.joins = joins;
		query.options.nestmap = options.embed;
	}
}

Table.prototype.one = function (filters, options) {
	var ret = new Row(this);
	ret.query.verb = "select";
	ret.query.filters = filters || {};
	if(options) attachOptions(ret.query, this, options);
	return ret;
};

Table.prototype.all = function (filters, options) {
	var ret = new Table(this);
	ret.query.verb = "select";
	ret.query.filters = filters || {};
	if(options) attachOptions(ret.query, this, options);
	return ret;
};

Table.prototype.related = function(relName, filters, options) {
	var sub = Object.create(this.query), res, relation = this.relations[relName];
	res = new Table(this.database.tables[relation.targetTable]);
	sub.verb = res.query.verb = "select";
	
	if(relation.outbound) {
		sub.options.columns = [relation.targetColumn];
		res.query.filters = filters || {};
		res.query.filters.id = ["IN", sub];
	} else {
		sub.options.columns = ["id"];
		res.query.filters = filters || {};
		res.query.filters[field.targetColumn] = ["IN", sub];
	}
	return res;
}

Table.prototype.count = function (filters) { /* not implemented */ };
Table.prototype.sum = function(column, filters) { /* not implemented */ };

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
	
	if(type && type.name === "foreign") {
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

Table.prototype.createSql = function(force) {
	var i, delim="", type, sql = "CREATE TABLE ",
		nd = this.database.dialect.nameDelim;
	
	this.finalize();
	
	sql += (force? "": "IF NOT EXISTS ") + nd + this.name + nd + " (";
	
	for(i in this.columns) {
		sql += delim + this.columns[i].createSql();
		delim = ", "
	}
	
	sql += ")";
	
	return sql;
}

Table.prototype.finalize = function() {
	if(!this.schema.id)
		this.schema.id = this.columns.id = this.column("id", types.Serial);
	
	this.schema.id.index = "primary";
	
	this.column = null;
	this.relation = null;
}

