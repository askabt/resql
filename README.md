ReSQL
=====

Generate a REST API from any DB Schema. It also works as a
really nice ORM for JavaScript.

Unlike [Sequelize](http://github.com/sdepold/sequelize), ReSQL
allows callback-less access while traversing your data structures,
giving much cleaner

Sequelize:
	students.find({where: {id: 34235}}).success(function(student) {
		student.getCourses().success(function(courses) {
			console.log(courses);
		});
	});

ReSQL:
	students.find({id: 34235}).courses().then(function(courses) {
		console.log(courses);
	});

While Sequelize will make two DB queries for the above operation,
ReSQL makes just one, using subqueries

Usage
-----

Define your API Schema like this:

	model = new ReSQL.Model(options);

Where options include database access parameters, like