ReSQL
=====

ReSQL is a really nice ORM for JavaScript which allows you to
write clean code without nested callbacks. It also gives you
REST API for reading and writing to your DB in the form of
Connect/Express middleware.

It also follows the
[CommonJS Promises/A](http://wiki.commonjs.org/wiki/Promises/A)
pattern in its ORM API.

[Sequelize](http://github.com/sdepold/sequelize):

```javascript
students.find({where: {id: 34235}}).success(function(student) {
	student.getCourses().success(function(courses) {
		console.log(courses);
	});
});
```

This will also result in multiple SQL queries:

```sql
SELECT * FROM "Students" WHERE "id"='34235'
SELECT * FROM "StudentCourses" WHERE "userId"='34235'
SELECT * FROM "Courses" WHERE "id" IN (...)
```

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


Usage
-----

Import:

	ReSQL = require("resql");

Define a new model:

	model = new ReSQL.Model(options);

Where options include database access parameters such as hostname,
credentials and database type (PostgreSQL or MySQL).

Define tables:

	students = new model.table('students', {
		name: ReSQL.String
	})

Relationships:

	

Querying