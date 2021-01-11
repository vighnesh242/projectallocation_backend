var express = require("express");
var db = require('../config/db.config');
const utils = require('./utils');
const axios = require('axios');

const router = express.Router();
router.use(express.json())

//CoordinatorProfile
router.get('/I2ICDomainPreferenceGraph', (request, response) => {
  const connection = db.connect();

  const statement = `SELECT count(*) as count FROM project_group group by Domain_Pref_1`;

  connection.query(statement, (error, result) => {
    connection.end();
    result = JSON.parse(JSON.stringify(result));
    var data = [];
    for (let i = 0; i < result.length; i++) {
      data[i] = result[i].count;
    }
    console.log(data);
    response.send(utils.createResponse(error, data));
  })
});

//CoordinatorProfile1
router.get('/I2ICRegistrationReport', (request, response) => {
  const connection = db.connect();


  const statement1 =
  `select p.Department_id, count(l.Learner_id) as registeredCount from learner l left JOIN person p on
     l.Person_id = p.Person_id where l.registered=1 GROUP BY p.Department_id order by p.Department_id ASC`;

  connection.query(statement1, (error, result1) => {
    // result = JSON.parse(JSON.stringify(result1));
    var info1=result1;
      const statement2 =
      `select p.Department_id, count(l.Learner_id) as totalCount from learner l left JOIN person p on 
          l.Person_id = p.Person_id GROUP BY p.Department_id order by p.Department_id ASC`;

      connection.query(statement2, (error, result2) => {
        // result1 = JSON.parse(JSON.stringify(result2));
        var info2=result2;

        var data = [];

        for (let i = 0; i < info1.length; i++) {
          for (let j = 0; j < info2.length; j++) {
            if(info1[i].Department_id === info2[j].Department_id)
            {
              data[info1[i].Department_id-1]=(info1[i].registeredCount/info2[j].totalCount)*100;
            }
          }
        }
        for (let i = 0; i < data.length; i++) {
          if(data[i]==null) data[i]=0;
        }
        // console.log(info1,info2,data);

        response.send(utils.createResponse(error, data));
      })
    
  })
});

//DepartmentNamesOnly
router.get("/DepartmentNamesOnly", (request, response) => {
  const connection = db.connect();
  const statement = `SELECT Name from department;`;
  connection.query(statement, (error, result) => {
      // connection.end();
    var data = [];
    for (let i = 0; i < result.length; i++) {
      data[i] = result[i].Name;
    }
    console.log(data);
      response.send(utils.createResponse(error, data));
  });
});

//Industry Project Count Report
router.get('/IndustryProjectData', (request, response) => {
  const connection = db.connect();


  const statement = `SELECT c.Company_name, COUNT(i.Company_id) as count FROM 
  company as c JOIN industryproject as i ON i.Company_id=c.Company_id GROUP BY i.Company_id`;
  //`SELECT count(*) as count FROM project_group group by Domain_Pref_1`;

  connection.query(statement, (error, result) => {
    connection.end();
    result = JSON.parse(JSON.stringify(result));
    
    var countdata=[];
    for (let i = 0; i < result.length; i++) {
      countdata[i] = result[i].count;
    }
    var namedata=[];
    for (let i = 0; i < result.length; i++) {
      namedata[i] = result[i].Company_name;
    }
    
    console.log(countdata);
    var data = [countdata,namedata];
    console.log(data)
    response.send(utils.createResponse(error, data));
  })
});


//DepartmentDomainPreferenceGraph
router.post('/DepartmentDomainPreferenceGraph', (request, response) => {
  const connection = db.connect();
  const { selectedDept } = request.body;
  console.log(selectedDept)
  const statement = `SELECT pd.Department_id,pd.Name as domainName,pd.domain_id,count(pg.Group_id) as count FROM project_group pg 
    LEFT JOIN project_domain pd ON pg.Domain_Pref_1=pd.Domain_id where pd.department_id=${selectedDept} group by Domain_Pref_1`

  connection.query(statement, (error, result) => {
    console.log(result)
    result = JSON.parse(JSON.stringify(result));
    
    var countdata=[];
    for (let i = 0; i < result.length; i++) {
      countdata[i] = result[i].count;
    }
    var namedata=[];
    for (let i = 0; i < result.length; i++) {
      namedata[i] = result[i].domainName;
    }
    
    console.log(countdata);
    var data = [countdata,namedata];
    result=data;
    console.log(data)
    connection.end();
    response.send(utils.createResponse(error, result));
  })
});

module.exports = router