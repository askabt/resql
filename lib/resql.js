/*
 *	Resql library
 *
 *	Copyright (c)
 *
 *
 *
 *	
 */

function Resql() {
	this.tables = {};
}

Resql.prototype.table = function(name, schema) {
	this[name] = new Table(name, schema);
}

function find(q) {
	if(typeof q === "string" || typeof q === "number") {
		this._filters = {"id": q};
	} else if(typeof q === "object") {
		this._filters = q;
		this._returns = "table";
	}
};



function Table(name, schema) {
	this.name = name;
	this.schema = schema;
}

function Row(table) {
	this.fields = table.schema;
}

function Parent(table, column) {
	this.table = table; this.column = column;
	// column is a FK on the current table, pointing to table
}

function Children(table, column) {
	this.table = table; this.column = column;
	// column is a FK on the table, pointing to current table
}

function sequelize(model, verb, path, opt, data) {
	var seg, ctx, q={}, nq, f;
	path = path.split("/");
	
	ctx = model;
	
	//---------------------------------------------------------------- Parsing -
	
	while(path.length) {
		seg = path.shift();
		
		if(ctx instanceof Resql) {
			if(!ctx[seg]) throw "Couldn't find table " + seg;
			q.table = seg;
			ctx = ctx[seg];
		} else if(ctx instanceof Table) {
			q.id = seg;
			ctx = new Row(ctx);
		} else if(ctx instanceof Row) {
			f = ctx.fields[seg];
			if(!f) throw "Couldn't find field " + seg;
			
			if(f instanceof Children) {
				q.columns = ["id"]; q.verb = "select";
				if(q.id) q = q.id;
				nq = {
					table: f.table,
					filters: [[f.column, "=", q]]
				};
				q = nq;
				
				ctx = model[f.table];
				if(!ctx) throw "Couldn't find table " + f.table + " at " + seg;
				
			} else if(f instanceof Parent) {
				q.columns = [f.column]; q.verb = "select";
				nq = {
					table: f.table,
					id: q
				};
				q = nq;
				
				ctx = model[f.table];
				if(!ctx) throw "Couldn't find table " + f.table + " at " + seg;
				ctx = new Row(ctx);
				
			} else {
				q.columns = [seg];
				ctx = f;
			}
		} else {
			throw "Expected end of path but found " + seg;
		}
	}
	
	//---------------------------------------------------------- Sequelization -
	
	if(verb == "get") {
		q.verb = "select";
	} else if(verb == "post") {
		if(ctx instanceof Row) {
			q.verb = "update"
		} else if(ctx instanceof Table) {
			q.verb = "insert"
		}
	}
	
	function toSql(query) {
		var sql, i, l;
		
		if(typeof query === "string") return "'" + query + "'";
		
		if(query.verb == "select") {
			sql = "SELECT " +
				(
					query.columns && query.columns.length?
					"`" + query.columns.join("`,`") + "`":"*"
				) +
				" FROM `" + query.table + "`";
			
			if(query.id) {
				sql += " WHERE `id`=" + toSql(query.id);
			} else if(query.filters && query.filters.length) {
				sql += " WHERE ";
				for(i=0,l=query.filters.length; i<l; i++) {
					sql += i>0?" AND ":"";
					sql += "`" + query.filters[i][0] + "`" +
						query.filters[i][1] + toSql(query.filters[i][2]);
				}
			}
		} else if(query.verb == "insert") {
			sql = "INSERT INTO "
			
		} else if(query.verb == "update") {
			
		}
		
		return "(" + sql + ")";
	};
	
	return toSql(q);
}

Resql.prototype.get = function(path, opt) {
	opt = opt || {};
	return sequelize(this, "get", path, opt);
};
Resql.prototype.post = function(path, opt, data) {
	if(opt && !data) { data = opt; opt = {}; }
	opt = opt || {};
	return sequelize(this, "post", path, opt, data);
};

Resql.Parent = Parent;
Resql.Children = Children;

module.exports = Resql;
