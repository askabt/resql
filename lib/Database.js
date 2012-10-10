var Table = require('./Table'),
	Row   = require('./Row'),
	types = require('./types');

module.exports = Database;

var dialects = {
	"mysql": {
		nameDelim: "`",
		valueDelim: "'",
		types: {
			"boolean": "BOOLEAN",
			"integer": "INTEGER",
			"float": "FLOAT",
			"string": "VARCHAR(255)",
			"text": "TEXT",
			"date": "DATETIME",
			"serial": "INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY"
		}
	},
	"postgresql": {
		nameDelim: "\"",
		valueDelim: "'",
		types: {
			"boolean": "BOOLEAN",
			"integer": "INTEGER",
			"float": "FLOAT",
			"string": "VARCHAR(255)",
			"text": "TEXT",
			"date": "TIMESTAMP",
			"serial": "SERIAL NOT NULL PRIMARY KEY"
		}
	}
}

function Database(options) {
	var lib;
	
	this.options = options;
	this.tables = {};

	if(!options.dialect) options.dialect = "mysql";
	if(!options.user) throw "No user specified.";
	if(!options.database) throw "No database specified.";

	this.dialect = dialects[options.dialect];
	
	if(options.dialect == "mysql") {
		try {
			lib = require("mysql");
		} catch(e) {
			throw "mysql library not found in node_modules";
		}
		
		this.db = lib.createConnection(options);
		this.db.connect(function(err) {
			if(err) throw err;
		});
			
	} else if(options.dialect == "postgresql") {
		try {
			lib = require("pg");
		} catch(e) {
			throw "pg library not found in node_modules";
		}
		
		this.db = lib.Client(options.path || options).
			connect(function(err) {
				if(err) throw err;
			});
		console.log("PostgreSQL is not yet tested. It will probably not work correctly.");
	} else {
		throw "Unsupported SQL Dialect"
	}
};

Database.prototype.table = function(name, schema) {
	return this.tables[name] = new Table(this, name, schema);
};

Database.prototype.query = function (query, callback) {
	var sql = this.toSql(query);
	sql = sql.substr(1, sql.length-2);
	console.log("Executing query: " + sql);

	if(!this.options.simulate) {
		this.db.query(sql, callback);
	} else {
		callback({dummy: "data"});
	}
};

Database.prototype.sync = function(force) {
	var i;
	for(i in this.tables) {
		if(force){
			console.log("Dropping table (if exists): " + i);
			if(!this.options.simulate) {
				this.db.query("DROP TABLE IF EXISTS " + i,
					function(err) { if(err) throw err; });
			}
		}
		this.syncTable(this.tables[i], force);
	}
};

Database.prototype.syncTable = function(table, force) {
	var i, delim="", type, sql = "CREATE TABLE ", nd = this.dialect.nameDelim;
	
	table.finalize();
	
	sql += (force? "": "IF NOT EXISTS ") + nd + table.name + nd + " (";
	
	for(i in table.schema) {
		type = table.schema[i].type;
		if(type && type.name) {
			sql += delim + this.dialect.nameDelim + i + this.dialect.nameDelim + " ";
			sql += this.getType(type);
			delim = ", "
		}
	}
	
	sql += ")";
	console.log("Creating table: " + sql);
	if(!this.options.simulate) {
		this.db.query(sql, function(err) { if(err) throw err; });
	}
};

Database.prototype.getType = function (type) {
	var typename = type.name;
	if(this.dialect.types[typename]) return this.dialect.types[typename];
	if(typename == "foreign") {
		this.tables[type.table].finalize();
		type = this.tables[type.table].schema.id.type;
		
		if(type.name == "serial") type = types.Integer;
		
		return this.getType(type);
	}
	console.log("WARNING: Unknown type ", type);
	return "TEXT";
};

Database.prototype.toSql = function (query) {
	var sql = "", i, delim = "", nd = this.dialect.nameDelim, self = this;
	
	if(typeof query !== "object") {
		return this.dialect.valueDelim + query + this.dialect.valueDelim;
	}
	
	if(query instanceof Date) {
		return this.dialect.valueDelim + query.toISOString() + this.dialect.valueDelim;
	}
	
	function where(filters) {
		var sql = "", delim="";
		for(i in filters) {
			sql += delim + i;
			if(filters[i] instanceof Array) {
				sql += filters[i][0] + self.toSql(filters[i][1]);
			} else {
				sql += "=" + self.toSql(filters[i]);
			}
			
			delim = " AND ";
		}
		return sql;
	}
	
	function set(data) {
		var sql = "", delim="";
		for(i in data) {
			sql += delim + nd + i + nd + "=" + self.toSql(data[i]);
			delim = ", ";
		}
		return sql;
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

Database.prototype.restHandler = function(options) {
	var self = this, segpat = /^([^/]+)(\/|$)/;
	options = options || {};
	
	return function(req, res, next) {
		var url = require("url").parse(req.url),
			path = url.pathname,
			data = "";
			qo = self.tables; // query object
			
		function success(r) {
			res.end(JSON.stringify({ status: { success: true }, data: r }));
		}
		
		function failure(r) {
			res.end(JSON.stringify({ status: { success: false, reason: r } }));
		}
		
		path = path.substr(1);
		if(!path) return failure("Empty path.");
		
		while(path) {
			path = path.replace(segpat, function(m, seg) {
				if(qo instanceof Table) {
					qo = qo.one({id: seg});
				} else {
					qo = qo[seg];
				}
				
				return "";
			});
			if(typeof qo !== "object") return failure("Invalid path before " + path);
		}
		
		req.on('data', function(chunk) { data += chunk; });
		req.on('close', function() { res.end("Unexpected end of input.") });
		req.on('end', function() {
			switch(req.method) {
				case "GET":
					qo.then(success, failure);
					break;
				case "POST":
					try {
						data = JSON.parse(data);
					} catch(e) {
						return failure('Invalid POSTdata: ' + e);
					}
					if(qo instanceof Table) {
						qo.add(data).then(success, failure);
					} else if(qo instanceof Row) {
						qo.save(data).then(success, failure);
					} else {
						res.end("That path doesn't take a POST.");
					}
					break;
				default:
					res.end("That method isn't implemented yet");
			}
		});
	}
}