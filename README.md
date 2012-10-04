# ResQL

ResQL is a Node.js ORM for working with MySQL an PostgreSQL databases.

## Contributing

If you're in Bangalore and you're interested in Node.js, open source and getting
paid for what you love to do, Askabt is looking to sponsor full- or part-time
contributors to ResQL. Write to [askabt@askabt.in](mailto:askabt@askabt.in).

## Comparison with [Sequelize](http://github.com/sdepold/sequelize):

Sequelize is currently the most popular Node.js ORM.

Before going into the differences in detail, note that Sequelize is a
fairly mature project and ResQL is not - right now you shouldn't use ResQL for
production code.

ResQL's _raison d'être_ is that it lets you code without nested callbacks. It
accomplishes this by two techniques:
 - Function chaining to express complex chains of model queries, which are then
   combined using an SQL query builder before a DB call is made.
 - Using the [CommonJS Promises/A](http://wiki.commonjs.org/wiki/Promises/A) API
   to allow chaining of your own operations with model queries.

Example: Consider the following code you might write using Sequelize:

```javascript
students.find({where: {id: 34235}}).success(function(student) {
	student.getCourses().success(function(courses) {
		console.log(courses);
	});
});
```

With ResQL, it's much neater:

```javascript
students.one({id: 34235}).courses().then(function(courses) {
	console.log(courses);
});
```

ResQL is also more efficient as it makes a single optimized SQL query (using
subqueries if necessary):

```sql
SELECT * FROM "Courses" WHERE id IN (
	SELECT courseId FROM "StudentCourses" WHERE userId='34235'
)
```

instead of

```sql
SELECT * FROM "Students" WHERE "id"='34235'
SELECT * FROM "StudentCourses" WHERE "userId"='34235'
SELECT * FROM "Courses" WHERE "id" IN (...)
```

ResQL also provides an HTTP/REST API for reading and writing to the DB in the
form of Connect/Express middleware.

Another thing to note is that the data modeling APIs stay close to the actual
table schema - you have complete control over foreign key names, for instance,
and still get the benefits of the ORM's relation handling. A single intuitive
relation() call replaces Sequelize's hasOne(), hasMany() and belongsTo().

To learn more, check out our [Guide](/askabt/resql/wiki/Guide) and
[Module API](/askabt/resql/wiki/Module-API).

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

