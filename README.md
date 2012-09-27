ReSQL
=====

ReSQL is an ORM for Node.JS with an API designed for clean
code without nested callbacks. It also gives you
REST API for reading and writing to the DB in the form of
Connect/Express middleware.

The API for querying conforms to
[CommonJS Promises/A](http://wiki.commonjs.org/wiki/Promises/A),
and data modelling API stays close to the table schema.

ReSQL:

```javascript
	students.find({id: 34235}).courses().then(function(courses) {
		console.log(courses);
	});
```

ReSQL is also faster, making a single SQL query (using subqueries
and joins where necessary) instead of multiple queries in series.

```sql
	SELECT * FROM "Courses" WHERE id IN (
		SELECT courseId FROM "StudentCourses" WHERE userId='34235'
	)
```

For comparison, [Sequelize](http://github.com/sdepold/sequelize) needs more callbacks:

```javascript
	students.find({where: {id: 34235}}).success(function(student) {
		student.getCourses().success(function(courses) {
			console.log(courses);
		});
	});
```

and will result in more queries:

```sql
	SELECT * FROM "Students" WHERE "id"='34235'
	SELECT * FROM "StudentCourses" WHERE "userId"='34235'
	SELECT * FROM "Courses" WHERE "id" IN (...)
```

Modeling Schema in ReSQL
------------------------

# Define a new DB #

```javascript
	db = new rs.connect(options);
```

Where options include database access parameters such as hostname,
credentials and database type (PostgreSQL or MySQL).

# Define tables #
In ReSQL, you define all the columns, even those related
to relationships - use your existing DB design knowledge to optimize
things.

If not specified, an "id" column will be created with type INT AUTOINCREMENT
or SERIAL

```javascript
	students = db.table('students', {
		name: rs.String,
		dob:  rs.Date,
	});
	
	courses = db.table('courses', {
		id:        rs.String,
		name:      rs.String,
		desc:      rs.Text,
		teacherId: rs.Foreign('teachers')
	});
	
	teachers = db.table('teachers', {
		name:   rs.String,
		joined: rs.Date
	})
```

You can also add columns later:

```javascript
	teachers.column('dob', rs.Date);
```

Tables for associations are no different.
	
```javascript
	sic = db.table('studentsInCourses', {
		studentId: rs.Foreign('students'),
		courseId:  rs.Foreign('courses')
	});
```

# Define relationships #

When you set up a foreign key such as with courses.teacherId above, it
automatically creates a relationship "teacher" (removing "Id" or "_id" at
the end) on the course objects. Now, you can use:
	
```javascript
	courses.find({id: myCourseId}).teacher().then(...);
```

In the opposite direction, you have to define a relationship:

```javascript
	teachers.relation('coursesTaught',
		'courses',	// target table
		'teacherId'	// column in target table
	);
	
	teachers.find({id: teachId}).coursesTaught().then(...);
```

You can similarly define many-many relationships,

```javascript
	courses.relation('students', 'studentsInCourses', 'courseId', 'student');
	students.relation('courses', 'studentsInCourses', 'studentId', 'course');
	
	// The last parameter is the name of a relationship on the target table
	
	courses.find({id: myCourseId}).students().then(...);
```
	
and Self-referencing relationships

```javascript
	nodes.column('parentId', rs.Foreign(nodes));
	nodes.relation('children', tree, tree.columns.parentId);
	
	nodes.find({parentId: null}).parent().children().
```


Using the ReSQL REST API
------------------------

The rest API maps HTTP GET/POST/DELETE calls to SELECT, INSERT, UPDATE and
DELETE queries, and sends back a JSON response.

Authentication, permissions and security, including protection against
DoS attacks via complex joins, will be handled.


