const sqlite3 = require('sqlite3').verbose();

// open database in memory
let db = new sqlite3.Database('./DB',sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQlite database.');
});
module.exports = db;