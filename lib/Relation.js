module.exports = Relation;

function Relation(table, name, options) {
	this.table = nameOf(table);
	this.name = name;
	this.type = options;
	this.targetTable = nameOf(options.table);
	this.targetColumn = nameOf(options.column);
	this.targetRelation = options.relation? nameOf(options.relation): null;
	this.outbound = options.outbound? true: false;
};

function nameOf(entity) {
	return (typeof entity === "object"? entity.name: entity);
}
