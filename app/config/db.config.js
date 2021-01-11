const mysql=require("mysql")

function connect(){
const connection=mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "database1",
    dialect: "mysql", 
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
   connection.connect();
   return connection;
}

  module.exports={
    connect :connect
  }
