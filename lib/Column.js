var types = require('./types.js');

module.exports = Column;

function Column(table, name, type) {
	this.table = table;
	this.name = name;
	this.type = type;
};

Column.prototype.createSql = function() {
	var db = this.table.database, dialect = db.dialect, ftable, ftype;
	var sql = dialect.nameDelimiter + this.name + dialect.nameDelimiter + " ";
	
	if(this.type.name == "foreign") {
		ftable = db.tables[this.type.table];
		ftable.finalize();
		
		ftype = ftable.schema.id.type;
		if(ftype.name == "serial") ftype = types.Integer();
		
		sql += ftype.createSql(dialect);
		
	} else {
		sql += this.type.createSql(dialect);
	}
};

