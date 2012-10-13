/*
 *	TODO in relation accessor methods:
 *	 - support for target relation
 *	 - apply filters and options
 *	
 *	
 */


var Relation = require("./Relation"),
	Column = require("./Column"),
	Query = require("./Query"),
	Table;

module.exports = Row;

function Row(table) {
	var schema = table.schema,
		db = table.query.database;
	
	this.query = new Query(db);
	this.query.table = table.name;
	
	this.proto = table.proto;
	
	for(i in schema) {
		this[i] = function(field) {
			if(field instanceof Relation) {
				if(field.outbound) {
					return makeOutboundAccessor(field, db.tables);
				} else {
					return makeInboundAccessor(field, db.tables);
				}
			} else {
				return makeColumnAccessor(field);
			}
		}(schema[i]);
	}
	
	Table = table.constructor;
}

function makeOutboundAccessor(field, tables) {
	return function (filters, options) {
		var res, q = this.query;
		
		if(q.filters[field.targetColumn] && (
			!(q.filters[field.targetColumn] instanceof Array) ||
			q.filters[field.targetColumn][0] == "="
		)) {
			q = q.filters[field.targetColumn];
		} else {
			q.options.columns = [field.targetColumn];
			q.verb = "select";
		}
		
		res = new Row(tables[field.targetTable]);
		res.query.verb = "select";
		
		if(field.targetRelation) {
			res.query.filters = {id: q};
			return res[field.targetRelation](filters, options);
		} else {
			res.query.filters = filters || {};
			res.query.filters.id = q;
			return res;
		}
	}
}

function makeInboundAccessor(field, tables) {
	return function (filters, options) {
		var res, q = this.query;
		if(q.filters.id && (
			!(q.filters.id instanceof Array) ||
			q.filters.id[0] == "="
		)) {
			q = this.query.filters.id;
		} else {
			q.options.columns = ["id"]
			q.verb = "select";
		}
		
		res = new Table(tables[field.targetTable]);
		
		if(field.targetRelation) {
			res.query.filters = {};
			res.query.filters[field.targetColumn] = q;
			return res.related(field.targetRelation, filters, options);
		} else {
			res.query.filters = filters || {};
			res.query.filters[field.targetColumn] = q;
			res.query.verb = "select";
			return res;
		}
	}
}

function makeColumnAccessor(field) {
	return function () {
		return this.query.execute().then(function(data) {
			return data[field[name]];
		});
	}
}

Row.prototype.then = function(callback, errback) {
	var self = this;
	this.query.verb = "select";
	return this.query.execute().then(function(data) {
		var i, obj;
		obj = Object.create(self.proto);
		for(i in data[0]) { obj[i] = data[0][i]; }
		obj.save = function() {
			self.save(this);
		}
		callback(obj);
	},
	errback);
};

Row.prototype.save = function (data) {
	this.query.verb = "update";
	this.query.data = data;
	
	return this.query.execute();
}

/*
	List of unallowed column/relation names:
	- then
	- query
	- proto
	- save
*/