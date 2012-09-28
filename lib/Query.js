var defer = require("./defer.js");

module.exports = Query;

function Query(database) {
	this.database = database;
	this.options = {};
};

Query.prototype.execute = function() {
	var data = defer();
	this.database.query(this, function(err, value) {
		if(err) data.resolve(defer.reject(err));
		else data.resolve(value);
	});
	return data.promise;
}

