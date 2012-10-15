exports.mysql = {
	nameDelim: "`",
	valueDelim: "'",
	types: {
		"boolean": "BOOLEAN",
		"integer": "INTEGER",
		"float": "FLOAT",
		"string": "VARCHAR(255)",
		"text": "TEXT",
		"date": "DATETIME",
		"serial": "INTEGER AUTO_INCREMENT",
		"default": "TEXT"
	},
	index: {
		"primary": "PRIMARY KEY",
		"unique": "UNIQUE KEY"
	}
};
	
exports.postgresql = {
	nameDelim: "\"",
	valueDelim: "'",
	types: {
		"boolean": "BOOLEAN",
		"integer": "INTEGER",
		"float": "FLOAT",
		"string": "VARCHAR(255)",
		"text": "TEXT",
		"date": "TIMESTAMP",
		"serial": "SERIAL",
		"default": "TEXT"
	},
	index: {
		"primary": "PRIMARY KEY",
		"unique": "UNIQUE KEY"
	}
}

