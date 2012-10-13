var Table = require('./Table'),
	Row   = require('./Row'),
	types = require('./types'),
	dialects = require('./dialects.js');

module.exports = Database;

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

Database.prototype.query = function (sql, callback) {
	console.log("Executing query: " + sql);

	if(!this.options.simulate) {
		this.db.query(sql, function(err, data) {
			if(err) callback(err);
			if(query.verb == "insert" && data.insertId > 0) {
				query.data.id = data.insertId;
			}
			if(query.verb == "insert" || query.verb == "update") {
				data = query.data;
			}
			
			callback(null, data);
		});
	} else {
		callback({dummy: "data"});
	}
};

Database.prototype.create = function(force) {
	var i, sql;
	for(i in this.tables) {
		if(force){
			console.log("Dropping table (if exists): " + i);
			if(!this.options.simulate) {
				this.db.query("DROP TABLE IF EXISTS " + i,
					function(err) { if(err) throw err; });
			}
		}
		sql = this.tables[i].createSql(force);
		console.log("Creating table: " + sql);
		if(!this.options.simulate) {
			this.db.query(sql, function(err) { if(err) throw err; });
		}
	}
};

Database.prototype.restHandler = function(options) {
	var self = this, segpat = /^([^/]+)(\/|$)/;
	options = options || {};
	
	return function(req, res, next) {
		var url = require("url").parse(req.url, true),
			path = url.pathname,
			params = url.query,
			data = "";
			qo = self.tables; // query object
			
		function success(r) {
			res.end(JSON.stringify({ status: { success: true }, data: r }));
		}
		
		function failure(r) {
			res.end(JSON.stringify({ status: { success: false, reason: r } }));
		}
		
		path = path.replace(/^\/+/g, "");	// remove leading slashes.
		if(!path) return failure("Empty path.");
		
		params.sessionid = req.cookies["connect.sid"];
		// TODO: Put additional authentication params
		
		
		req.on('data', function(chunk) { data += chunk; });
		req.on('close', function() { res.end("Unexpected end of input.") });
		req.on('end', function() {
			res.writeHead(200, {"Content-Type": "application/json"});
			
			if(data) try {
				data = JSON.parse(data);
			} catch(e) {
				return failure('Invalid POSTdata: ' + e);
			}
			
			while(path) {
				path = path.replace(segpat, function(m, seg) {
					var segd = decodeURIComponent(seg);
					if(qo instanceof Table) {
						if(seg.indexOf(',') != -1) {
							seg = seg.split(',').map(decodeURIComponent);
							qo = qo.all({id: ["IN", seg]});
						}
						else if("function" === typeof qo[segd]) {
							qo = qo[segd](data, params);
						}
						else {
							qo = qo.one({id: segd});
						}
					} else {
						qo = qo[segd];
						if(typeof qo == "function") qo = qo(data, params);
					}
					
					return "";
				});
				if(typeof qo !== "object")
					return failure("Invalid path before " + path);
			}
			
			switch(req.method) {
				case "GET":
					qo.then(success, failure);
					break;
				case "POST":
					if(qo instanceof Table) {
						qo.add(data).then(success, failure);
					} else if(qo instanceof Row) {
						qo.save(data).then(success, failure);
					} else {
						qo.then(success, failure);
					}
					break;
				default:
					res.end("That method isn't implemented yet");
			}
			return null; // stop the editor from complaining.
		});
		return null;
	}
}