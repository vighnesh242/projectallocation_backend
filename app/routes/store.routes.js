var express = require("express");
var db = require('../config/db.config');
const utils = require('./utils');
const axios = require('axios');

const router = express.Router();
router.use(express.json())

//LOGIN API TO FETCH GRNO_EMPCODE & Department
router.post("/Store", (request, response) => {
  const connection = db.connect();
  const { username } = request.body; //From Front End
  utils.grno_Emp = username;

  const statement = `select Department_id from person where grno_EmpCode='${username}'`;
  connection.query(statement, (error, result) => {
    console.log(result);
    result = JSON.parse(JSON.stringify(result));
    let department = result[0].Department_id;//store department_id
    utils.department = department;
    console.log(utils.department);
    connection.end();
  });
})

router.get("/Domain", (request, response) => {
  const connection = db.connect();
  const statement = `SELECT Name,Domain_id FROM project_domain;`;
  connection.query(statement, (error, result) => {
      connection.end();
      response.send(utils.createResponse(error, result));
  });
});

router.get("/DepartmentDomain", (request, response) => {
  const connection = db.connect();
  const statement = `SELECT Name,domain_id FROM project_domain where Department_id=
                     (select Department_id from person where grno_EmpCode='${utils.grno_Emp}');`;
  connection.query(statement, (error, result) => {
      connection.end();
      response.send(utils.createResponse(error, result));
  });
});

router.get("/Department", (request, response) => {
  const connection = db.connect();
  const statement = `SELECT Name, Department_id from department;`;
  connection.query(statement, (error, result) => {
      connection.end();
      response.send(utils.createResponse(error, result));
  });
});

router.get("/Company", (request, response) => {
  const connection = db.connect();
  const statement = `SELECT Company_name as Name, Company_id from company;`;
  connection.query(statement, (error, result) => {
      connection.end();
      response.send(utils.createResponse(error, result));
  });
});

module.exports = router