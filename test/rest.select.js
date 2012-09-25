resql = require("../lib/resql");

var model = new resql();

model.table('users', {
	"id": "asdf",
	"nick": "asdf",
	
	"subscriptions": new Resty.Children("subscriptions", "userId")
});

model.table('subscriptions', {
	"id": "asdfasd",
	"user": new Resty.Parent("users", "user")
});

console.log(model.get('subscriptions/1234/user/subscriptions'));


model.users("asdfsd").subscriptions().then(function(subscriptions) {
	
});

/*	
 *
 *	Javascript API:
 *
 *	model = new resql(db_options);
 *
 *	model.define()

	example API:
	
		wh/users/100
		
		SELECT * FROM users WHERE id = 100
	
		wh/users/100/addresses
		
		SELECT * FROM addresses WHERE userId = (SELECT id FROM users WHERE id = 100)
		
		wh/addresses/<address>/user
		
		SELECT * FROM users WHERE id = (SELECT userId FROM addresses WHERE id = 100)
	
		wh/addresses/<address>/user/addresses
		
		SELECT * FROM addresses WHERE userId = (SELECT id FROM users WHERE id = (SELECT userId FROM addresses WHERE id = <address>))
		SELECT * FROM addresses WHERE userId = (SELECT userId FROM addresses WHERE id=<address>)
	
		wh/addresses/<address>/user/addresses/add
		
		INSERT INTO addresses SET userId = (SELECT userId FROM addresses WHERE id=<address>)
		
		wh/topics/<topic>/conversations/add
		
		INSERT INTO conversations SET topicId = <topic>
 *
 *	resql.table(name, schema)
 *
	:tablename			table	q.tablename = :tablename
	[table]/:id			row		q.filters.id = :id
	[row]/:foreign		row		ctx.id=subquery:SELECT foreign.colname,
								ctx.tablename=foreign.tablename
	[object]/:remote	table
	
	GET array			SELECT opt.fields FROM ctx.tablename WHERE opt.filters
	GET object			SELECT opt.fields FROM ctx.tablename WHERE id=ctx.id

 *
 */