var rs = require("../lib/resql"),
    db = new rs.connect({
		dialect: "mysql",
		host: "localhost",
		user: "askabt",
		password: "askabt",
		database: "test"
	});

db.table('students', {
	name:    rs.String,
	dob:     rs.Date,
	
	courseMembership: rs.Relation('studentsInCourses', 'studentId'),
	courses: rs.Relation('studentsInCourses', 'studentId', 'course')
});

db.table('courses', {
	name:      rs.String,
	teacherId: rs.Foreign('teachers'),
	
	students:  rs.Relation('studentsInCourses', 'courseId', 'student')
});

db.table('teachers', {
	name:   rs.String,
	joined: rs.Date,
	
	courses: rs.Relation('courses', 'teacherId')
});

db.table('studentsInCourses', {
	studentId: rs.Foreign('students'),
	courseId:  rs.Foreign('courses')
});


db.putDummyData = function() {
	db.tables.students.add({id: 1, name: "Student A", dob: "1984-10-01"});
	db.tables.students.add({id: 2, name: "Student B", dob: "1984-06-15"});
	
	db.tables.teachers.add({id: 1, name: "Teacher A", joined: "2011-03-20"});
	db.tables.teachers.add({id: 2, name: "Teacher B", joined: "2012-08-14"});
	
	db.tables.courses.add({id: 1, name: "Physics", teacherId: 1});
	db.tables.courses.add({id: 2, name: "Chemistry", teacherId: 2});
	
	db.tables.studentsInCourses.add({studentId: 1, courseId: 1});
	db.tables.studentsInCourses.add({studentId: 1, courseId: 2});
	return db.tables.studentsInCourses.add({studentId: 2, courseId: 1});

	// MySQL will do all the queries in order so when the
	// last one finishes we can be sure everything before
	// is done, too.
}

module.exports = db;