ReSQL
=====

ReSQL is an ORM for Node.JS with an API designed for clean
code without nested callbacks. It also gives you
REST API for reading and writing to the DB in the form of
Connect/Express middleware.

The API conforms to
[CommonJS Promises/A](http://wiki.commonjs.org/wiki/Promises/A).

ReSQL:

	students.find({id: 34235}).courses().then(function(courses) {
		console.log(courses);
	});

ReSQL is also faster, making a single SQL query (using subqueries
and joins where necessary) instead of multiple queries in series.

	SELECT * FROM "Courses" WHERE id IN (
		SELECT courseId FROM "StudentCourses" WHERE userId='34235'
	)

For comparison, [Sequelize](http://github.com/sdepold/sequelize) needs more callbacks:

	students.find({where: {id: 34235}}).success(function(student) {
		student.getCourses().success(function(courses) {
			console.log(courses);
		});
	});

Sequelize code will also result in more queries:

	SELECT * FROM "Students" WHERE "id"='34235'
	SELECT * FROM "StudentCourses" WHERE "userId"='34235'
	SELECT * FROM "Courses" WHERE "id" IN (...)

Modeling Schema in ReSQL
------------------------

Define a new DB:

	db = new rs.connect(options);

Where options include database access parameters such as hostname,
credentials and database type (PostgreSQL or MySQL).

Define tables: In ReSQL, you define all the columns, even those related
to relationships - use your existing DB design knowledge to optimize
things.

If not specified, an "id" column will be created with type INT AUTOINCREMENT
or SERIAL

	students = db.table('students', {
		name: rs.String,
		dob:  rs.Date,
	});
	
	courses = db.table('courses', {
		id:        rs.String,
		name:      rs.String,
		desc:      rs.Text,
		teacherId: rs.Foreign(teachers)
	});
	
	teachers = db.table('teachers', {
		name:   rs.String,
		joined: rs.Date
	})
	
You can also add columns later:

	teachers.column('dob', rs.Date);

Tables for associations are no different.
	
	sic = db.table('studentsInCourses', {
		studentId: rs.Foreign(students),
		courseId:  rs.Foreign(courses)
	});
	
Relationships:

When you set up a foreign key such as with courses.teacherId above, it
automatically creates a relationship "teacher" (removing "Id" or "_id" at
the end) on the course objects. Now,
	
	courses.find({id: myCourseId}).teacher().then(...);

In the opposite direction, you have to define a relationship:

	teachers.relation('coursesTaught',
		courses, 						// target table, column or relation
		courses.columns.teacherId		// foreign key to search
	);
	
	teachers.find({id: teachId}).coursesTaught().then(...);

Similarly for many-many relationships,

	courses.relation('students', sic.relations.student, sic.columns.courseId);
	students.relation('courses', sic.relations.course, sic.columns.studentId);
	
	courses.find({id: myCourseId}).students().then(...);
	

	