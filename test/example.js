var rs = require("../lib/resql"),
    db = new rs.connect({});

var students = db.table('students', {
	name: rs.String,
	dob:  rs.Date,
});

var courses = db.table('courses', {
	id:        rs.String,
	name:      rs.String,
	desc:      rs.Text,
	teacherId: rs.Foreign('teachers')
});

var teachers = db.table('teachers', {
	name:   rs.String,
	joined: rs.Date
});

teachers.column('dob', rs.Date);

db.table('studentsInCourses', {
	studentId: rs.Foreign('students'),
	courseId:  rs.Foreign('courses')
});

courses.one({id: 1234}).teacher().then(
	function(result) {
		console.log("Result:", result);
	}
);

