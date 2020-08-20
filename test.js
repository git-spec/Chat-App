const Entities = require('html-entities').XmlEntities;
 
const entities = new Entities();
 
console.log(entities.encode(`'; delete from users;`));