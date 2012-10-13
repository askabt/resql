var db = require('./testdb');

var courses = db.tables.courses,
	teachers = db.tables.teachers,
	students = db.tables.students;


students.one(
	{ id: 1 },
	{ embed: { courses: { teacher: true } } }
).
then(function(data) {
	console.log(JSON.stringify(data, null, 2));
});





























//db.options.simulate = true;

//db.create();
//db.putDummyData().then(null,function(reason){console.log(reason);});


// students.one({id: 123}).courses().then();

/*
//process.exit(0);
// db.create(true);

courses.one({id: 1234}).teacher().courses().then(function(res) {
	console.log(res);
});

// process.exit();

students.add({
	name: "Aravind",
	dob: new Date("1984-10-01")
});

courses.one({id: 1234}).teacher().then(
	function(result) {
		console.log("courses/teacher:", result);
	}
);
/*
teachers.one({id: 1234}).coursesTaught().then(function(result) {
	console.log("teachers/coursesTaught", result);
});


/* */
db.db.end();

