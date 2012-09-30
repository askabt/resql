var Table = require('./Table');

module.exports = Database;

function Database(options) {
	this.options = options;
	this.tables = {};
}

Database.prototype.table = function(name, schema) {
	return this.tables[name] = new Table(this, name, schema);
}

Database.prototype.query = function (query, callback) {
	var sql = toSql(query);
	console.log(sql);
	
	// TODO: some actual querying.
	
	callback({});
}

function toSql(query) {
	var sql = "", i, delim = "";
	
	if(typeof query !== "object") return "'" + query + "'";
	
	if(query.verb == "select") {
		sql = "SELECT " +
			(
				query.options.columns && query.options.columns.length?
				"`" + query.options.columns.join("`,`") + "`":"*"
			) +
			" FROM `" + query.table + "`";
		if(query.filters) {
			sql += " WHERE ";
			for(i in query.filters) {
				sql += delim + i;
				if(query.filters[i] instanceof Array) {
					sql += query.filters[i][1] + toSql(query.filters[i][2]);
				} else {
					sql += "=" + toSql(query.filters[i]);
				}
				
				delim = " AND ";
			}
		}
	} else if(query.verb == "insert") {
		sql = "INSERT INTO ";
		
	} else if(query.verb == "update") {
		sql = "UPDATE ";
	}
	
	if(!sql) {
		console.log(query); 
	}
	
	return "(" + sql + ")";
};
