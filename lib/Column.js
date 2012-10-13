var types = require('./types.js');

module.exports = Column;

function Column(table, name, type) {
	this.table = table;
	this.name = name;
	this.type = type;
};

Column.prototype.createSql = function() {
	var db = this.table.database, dialect = db.dialect, ftable, ftype;
	var sql = dialect.nameDelim + this.name + dialect.nameDelim + " ";

	function colDef(type) {
		return dialect.types[type.name] || dialect.types["default"];
	}
	
	if(this.type.name == "foreign") {
		ftable = db.tables[this.type.table];
		ftable.finalize();
		
		ftype = ftable.schema.id.type;
		if(ftype.name == "serial") ftype = types.Integer();
		
		sql += colDef(ftype);
		
	} else {
		sql += colDef(this.type);
		if(this.index) sql += " " + (dialect.index[this.index] || "");
	}
	return sql;
};

