var rs = require("../lib/resql"),
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

teachers.column('dob', rs.Date);

console.log(courses.schema);


db.table('studentsInCourses', {
	studentId: rs.Foreign('students'),
	courseId:  rs.Foreign('courses')
});

process.exit(0);
db.sync(true);

students.add({
	name: "Aravind",
	dob: new Date("1984-10-01")
});
/*
courses.one({id: 1234}).teacher().then(
	function(result) {
		console.log("courses/teacher:", result);
	}
);

teachers.one({id: 1234}).coursesTaught().then(function(result) {
	console.log("teachers/coursesTaught", result);
});


/* */
db.db.end();

