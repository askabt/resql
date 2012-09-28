ResQL
=====

ResQL is an ORM for Node.JS with an API designed for clean
code without nested callbacks. It also gives you
REST API for reading and writing to the DB in the form of
Connect/Express middleware.

The [Module API](/askabt/resql/wiki/Module-API) methods for querying conforms to
[CommonJS Promises/A](http://wiki.commonjs.org/wiki/Promises/A),
and those for data modelling API stays close to the table schema.

Querying using ResQL:

```javascript
students.one({id: 34235}).courses().then(function(courses) {
	console.log(courses);
});
```

ResQL is also faster, making a single SQL query (using subqueries
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

Modeling Schema in ResQL
------------------------

### Define a new DB ###

```javascript
db = new rs.connect(options);
```

Where options include database access parameters such as hostname,
credentials and database type (PostgreSQL or MySQL).

### Define tables ###
In ResQL, you define all the columns, even those related
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
db.table('studentsInCourses', {
	studentId: rs.Foreign('students'),
	courseId:  rs.Foreign('courses')
});
```

### Define relationships ###

When you set up a foreign key such as with courses.teacherId above, it
automatically creates a relationship "teacher" (removing "Id" or "_id" at
the end) on the course objects. Now, you can use:
	
```javascript
courses.find({id: myCourseId}).teacher().then(...);
```

In the opposite direction, you have to define a relations manually:

```javascript
teachers.relation('coursesTaught', {
	table:  'courses',	// target table
	column: 'teacherId'	// column in target table
});

teachers.find({id: teachId}).coursesTaught().then(...);
```

You can similarly define many-many relations

```javascript
courses.relation('students', {
	table: 'studentsInCourses', column: 'courseId', relation: 'student'
});
students.relation('courses', {
	table: 'studentsInCourses', column: 'studentId', relation: 'course'
});

courses.find({id: myCourseId}).students().then(...);
```

as well as self-referencing relations.

```javascript
nodes.column('parentId', rs.Foreign(nodes));
nodes.relation('children', {table: 'nodes', column: 'parentId'});

nodes.find({parentId: null}).parent().children().
```

If the "Id" or "_id" convention for outbound relations doesn't work for you,
you can also define them using the relation() method by passing the option
outbound: true.

Using the ResQL REST API
------------------------

The rest API maps HTTP GET/POST/DELETE calls to SELECT, INSERT, UPDATE and
DELETE queries, and sends back a JSON response.

Authentication, permissions and security, including protection against
DoS attacks via complex joins, will be handled.

```javascript
app = express();
app.use(db.middleware(options));
```

This will be updated with more info soon.

License
-------
(The MIT License)

Copyright (c) 2009-2011 Askabt <www.askabt.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

