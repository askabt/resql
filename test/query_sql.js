var testDb = require("./testdb.js"),
	Query = require("../lib/Query.js"),
	dialect = require("../lib/dialects")["mysql"];
	
var query = new Query();

query.verb = "select";
query.table = "students";
query.joins = [
	{table: "courses", column: ""}
]

console.log("Query1": query.sql());