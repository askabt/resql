var rs = require("../lib/resql"),
	http = require("http"),
    db = new rs.connect({
		dialect: "mysql",
		host: "localhost",
		user: "askabt",
		password: "askabt",
		database: "askabt"
	});

var students = db.table('students', {
	name: rs.String,
	dob:  rs.Date,
});

var courses = db.table('courses', {
	id:        rs.String,
	name:      rs.String,
	desc:      rs.Text,
	teacherId: rs.Foreign('teachers'),
	
	faculty:   rs.Relation('teacherId')
});

var teachers = db.table('teachers', {
	name:   rs.String,
	joined: rs.Date,
	
	courses: rs.Relation('courses', 'teacherId')
});

// db.sync(true);

var handler = db.makeRest({});
var form = require("fs").readFileSync("index.html");
http.createServer(function(req, res) {
	if(req.url == "/")
		res.end(form);
	else
		handler(req, res);
}).listen(9999);
console.log("http://localhost:9999");
