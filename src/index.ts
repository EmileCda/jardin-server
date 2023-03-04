console.log('**********JS on line **************** ')

var mysql = require('mysql'); 


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'a',
    database: 'legume-js'
  });

  connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
const database = "toto";

  connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);