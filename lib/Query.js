var defer = require("./defer.js");

module.exports = Query;

function Query(database) {
	this.database = database;
	this.dialect = database.dialect;
	this.options = {};
};

Query.prototype.execute = function() {
	var data = defer();
	this.database.query(
		this.sql(this).substr(1, sql.length-2),
		function(err, value) {
			if(err) data.resolve(defer.reject(err));
			else data.resolve(value);
		}
	);
	return data.promise;
};

Query.prototype.sql = function (query) {
	var sql = "", i, delim = "", nd = this.dialect.nameDelim, self = this;
	
	if(typeof query !== "object") {
		return this.dialect.valueDelim + query + this.dialect.valueDelim;
	}
	
	if(query instanceof Date) {
		return this.dialect.valueDelim + query.toISOString() + this.dialect.valueDelim;
	}
	
	if(query instanceof Array) {
		return "(" + query.
			map(function(val) { return self.sql(val); }).
			join(",") + ")";
	}
	
	function where(filters) {
		var sql = "", delim="";
		for(i in filters) {
			sql += delim + i;
			if(filters[i] instanceof Array) {
				sql += " " + filters[i][0] + " " + self.sql(filters[i][1]);
			} else {
				sql += "=" + self.sql(filters[i]);
			}
			
			delim = " AND ";
		}
		return sql;
	}
	
	function set(data) {
		var sql = "", delim="";
		for(i in data) {
			sql += delim + nd + i + nd + "=" + self.sql(data[i]);
			delim = ", ";
		}
		return sql;
	}
	
	function values(data) {
		
	}
	
	if(query.verb == "select") {
		sql = "SELECT " + (
			query.options.columns && query.options.columns.length?
				nd + query.options.columns.join(nd + ", " + nd) + nd: "*"
		) + " FROM " +nd + query.table + nd;
		if(query.filters) {
			sql += " WHERE " + where(query.filters);
		}
	} else if(query.verb == "insert") {
		sql = "INSERT INTO " + nd + query.table + nd +
			" SET " + set(query.data);
	} else if(query.verb == "update") {
		if(!query.filters) throw "Can't update without filters.";
		sql = "UPDATE " + nd + query.table + nd +
			" SET " + set(query.data) +
			" WHERE " + where(query.filters) +
			" LIMIT 1";
	} else if(query.verb == "delete") {
		if(!query.filters) throw "Can't delete without filters.";
		sql = "DELETE FROM " + nd + query.table + nd +
			" WHERE " + where(query.filters);
	}
	
	if(!sql) {
		console.log(query.verb + " is not a valid verb."); 
	}
	
	return "(" + sql + ")";
};
