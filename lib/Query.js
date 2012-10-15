var defer = require("./defer.js");

module.exports = Query;

function Query(database) {
	this.database = database;
	this.dialect = database.dialect;
	this.options = {};
};

Query.prototype.execute = function() {
	var data = defer(), self = this;
	this.database.query(
		this.sql(this, 0),
		function(err, value) {
			var tableMap = {}, i, out = {};
			
			if(err) {
				data.resolve(defer.reject(err));
				return;
			}
			
			function assemble(map, objs) {
				var i, obj = objs[map._ref];
				
				for(i in map) {
					if(i == "_ref" || i == "_out") continue;
					obj[i] = map[i]._out?
						assemble(map[i], objs) : [assemble(map[i], objs)];
				}
				
				return obj;
			}
			
			function merge(src, dst) {
				if(typeof src != "object" || typeof dst != "object") return dst;
				if(src instanceof Array && dst instanceof Array) {
					if(src[0].id != dst[0].id) src.push(dst[0]);
				} else for(i in dst) {
					src[i] = merge(src[i], dst[i]);
				}
				return src;
			}
			
			// If it's a select, I need to embed nested objects properly.
			
			if(self.verb == "select") {
				
				tableMap.A = self.database.tables[self.table];
				
				for(i in self.options.joins) {
					tableMap[i] = self.database.tables[self.options.joins[i].table];
				}
				
				//console.log("Table map is: ", tableMap);
				//console.log("Value is: ", value);
				
				for(i in value) {
					var j, row = value[i], tRef, colName, objs = {}, obj;
					
					for(j in tableMap) objs[j] = {};
					
					for(j in row) {
						if(j == "parse" || j == "_typeCast") continue;
						tRef = j.substr(0,1); colName = j.substr(2);
						objs[tRef][colName] = row[j];
					}
					
					obj = assemble(self.options.nestmap, objs);
					out[obj.id] = merge(out[obj.id], obj);
				}
				value = [];
				for(i in out) value.push(out[i]);
			}
			
			// If it's an insert or an update, I'm sending back the original
			// object. I should probably do a SELECT and send that, though.
			
			if(self.verb == "insert" && value.insertId > 0) {
				this.data.id = data.insertId;
			}
			if(self.verb == "insert" || self.verb == "update") {
				value = this.data;
			}
			
			data.resolve(value);
		}
	);
	return data.promise;
};

Query.prototype.sql = function (query, level) {
	var sql = "", i, delim = "", nd = this.dialect.nameDelim, self = this, join;
	
	if(level > 5) throw "Too deeply nested SQL";
	
	if(typeof query !== "object") {
		return this.dialect.valueDelim + query + this.dialect.valueDelim;
	}
	
	if(query instanceof Date) {
		return this.dialect.valueDelim + query.toISOString() + this.dialect.valueDelim;
	}
	
	if(query instanceof Array) {
		return "(" + query.
			map(function(val) { return self.sql(val, level+1); }).
			join(",") + ")";
	}
	
	function where(filters) {
		var sql = "", delim="", i;
		for(i in filters) {
			sql += delim + "A." + nd + i + nd;
			if(filters[i] instanceof Array) {
				sql += " " + filters[i][0] + " " + self.sql(filters[i][1], level+1);
			} else {
				sql += "=" + self.sql(filters[i], level+1);
			}
			
			delim = " AND ";
		}
		return sql;
	}
	
	function set(data) {
		var sql = "", delim="", i;
		for(i in data) {
			sql += delim + nd + i + nd + "=" + self.sql(data[i], level+1);
			delim = ", ";
		}
		return sql;
	}
	
	function values(data) {
		
	}
	
	function joinColumns(joins) {
		var i, sql = "";
		for(i in joins)
			sql += ", " + tableColumns(i, joins[i].table);
		return sql;
	}
	
	function tableColumns(pre, columns) {
		if(typeof columns == "string")
			columns = Object.keys(self.database.tables[columns].columns);
		
		return columns.map(function(item) {
			return pre + "." + nd + item + nd + " AS " + nd + pre + "_" + item + nd
		}).join(", ");
	}
	
	if(query.verb == "select") {
		sql = "SELECT " + (
			query.options.columns && query.options.columns.length?
				tableColumns("A", query.options.columns):
				tableColumns("A", query.table) + (query.options.joins?
					joinColumns(query.options.joins): "")
		) + " FROM " +nd + query.table + nd + " AS A";
		
		if(query.options.joins) {
			for(i in query.options.joins) {
				join = query.options.joins[i];
				sql += " LEFT OUTER JOIN " + nd + join.table + nd + " AS " + i +
					" ON " + join.keyTable + "." + nd + join.key + nd +
					"=" + join.idTable + "." + nd + "id" + nd;
			}
		}
		
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
	
	return level?"(" + sql + ")": sql;
};
