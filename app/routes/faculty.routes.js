var express = require("express");
var db = require('../config/db.config');
const utils = require('./utils');
const axios = require('axios');
// var grno_Emp="F001";

const router = express.Router();
router.use(express.json())

//FACULTY REGISTRATION API
router.post("/FacultyRegistration", (req, res) => {
  // const { grno_EmpCode } = req.body;

  //update the registred column in instructor logged-in
  const statement = ` update instructor set registered=True where Person_id=(select Person_id from person 
                         where grno_EmpCode='${utils.grno_Emp}');`;

  const connection = db.connect();
  connection.query(statement, (error, result) => {
    console.log(result);

    connection.end();
    res.send(utils.createResponse(error, result));


  });
});
router.get("/FacultyRegistration", (req, res) => {
  const connection = db.connect();

  //All the faculty details from person table of faculty logged in 
  const statement = ` SELECT p.FullName,  p.mobile,p.email, d.name as department_name, p.grno_EmpCode FROM  person AS p 
                        INNER JOIN department AS d ON d.Department_id = p.Department_id WHERE p.grno_EmpCode = '${utils.grno_Emp}'`;

  connection.query(statement, (error, result) => {
    connection.end();
    res.send(utils.createResponse(error, result));
  });
});


//Domain REGISTRATION API
router.post("/DomainRegistration", (req, res) => {
  const { grno_EmpCode, Domain_Pref_1, Domain_Pref_2, Domain_Pref_3 } = req.body;
  //updating the domain preferences in instructor table
  const statement = ` update instructor set Domain_Pref_1='${Domain_Pref_1}',Domain_Pref_2='${Domain_Pref_2}', 
                        Domain_Pref_3='${Domain_Pref_3}' where Person_id=(select Person_id from person where 
                        grno_EmpCode='${utils.grno_Emp}');`;

  const connection = db.connect();
  connection.query(statement, (error, result) => {

    connection.end();
    res.send(utils.createResponse(error, result));
  });

});



//TO GET THE GROUP DETAILS OF ALLOCATED GROUP ENTERED ON FACULTY PAGE
router.get('/FacultyGroupDetails', (request, response) => {

  const connection = db.connect();

  //Group ids of all the groups haing instructor_id as logged-in faculty
  const statement = `select pg.Group_Name  ,
  pd.Name as final_domain,
  p.grno_EmpCode,p.FullName,pd.Name,p.Mobile,p.Email
  from
  project_group as pg   
  JOIN department as d on d.Department_id=pg.Department_id
  JOIN instructor as i on i.Instructor_id=pg.Instructor_id1 
  JOIN person as p1 on i.Person_id=p1.Person_id
  JOIN learner as l ON l.group_id=pg.Group_id
  JOIN person as p ON p.Person_id=l.Person_id
  JOIN project_domain AS pd ON  pd.Domain_id = pg.final_domain
     
                       
    where pg.Group_id in (select Group_id from project_group where 
    Instructor_id1=(select Instructor_id from instructor where Person_id=(select Person_id from person 
    WHERE grno_EmpCode ='F003'))) OR 
                                             
    pg.Group_id in (select Group_id from project_group where
    Instructor_id2=(select Instructor_id from instructor where Person_id=(select Person_id from person 
    WHERE grno_EmpCode ='F001')))`;


  connection.query(statement, (error, result) => {
    connection.end();
    console.log(result);
    response.send(utils.createResponse(error, result));


    if (!error) {
      console.log("Success");
    }
  })
});
// const statement = `SELECT
//     pg.Group_Name,
//     pd.Name as final_domain,
//     p.Mobile,p.Email
//     (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member1 )) as Member1,
//     (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member1 )) as Member1name,
//     (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member2 )) as Member2,
//     (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member2 )) as Member2name,
//     (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member3 )) as Member3,
//     (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member3 )) as Member3name, 
//     (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member4 )) as Member4,
//     (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member4 )) as Member4name
//     FROM 
//     project_group as pg INNER join learner as l on l.group_id=pg.Group_id
//     INNER JOIN person as p on p.Person_id=l.Person_id 
//     inner join project_domain as pd on pd.Domain_id=pg.final_domain 
                       
//     where pg.Group_id in (select Group_id from project_group where 
//     Instructor_id1=(select Instructor_id from instructor where Person_id=(select Person_id from person 
//     WHERE grno_EmpCode ='${utils.grno_Emp}'))) OR 
                                             
//     pg.Group_id in (select Group_id from project_group where
//     Instructor_id2=(select Instructor_id from instructor where Person_id=(select Person_id from person 
//     WHERE grno_EmpCode ='${utils.grno_Emp}'))) GROUP BY pg.Group_Name;`;

//TO GET THE INDUSTRY PROJECTS ENTERED BY PROJECT CO-ORDINATOR on FACULTY PAGE 
router.get('/FacultyIndustryProject', (request, response) => {
  const connection = db.connect();

  //display industry_projects
  const statement = `SELECT ip.industry_project_id, 
  GROUP_CONCAT(DISTINCT dt.Name)as industryproject_department,
  GROUP_CONCAT(DISTINCT dt.Department_id)as industryproject_department_id,
  GROUP_CONCAT(DISTINCT d.Name)as industryproject_domain,
  GROUP_CONCAT(DISTINCT d.Domain_id)as industryproject_domain_id,
  (SELECT Company_name from company where Company_id = ip.Company_id) as CompanyName, 
  ip.Description,
  ip.DueDate, 
  ip.Links,
  p.grno_EmpCode as FacultyRef 
  FROM industryproject AS ip 
  JOIN industryproject_department as ipdt on ipdt.industryproject_id=ip.industry_project_id 
  JOIN industryproject_domain as ipd on ipd.industryproject_id=ip.industry_project_id 
  JOIN department as dt on dt.Department_id=ipdt.Department_id
  JOIN project_domain as d on d.Domain_id=ipd.Domain_id
  INNER JOIN instructor as i ON i.Instructor_id=ip.FacultyRef 
  INNER JOIN person as p on p.Person_id=i.Person_id 
  WHERE visible= True and ip.DueDate>CURRENT_DATE
  GROUP BY ipdt.industryproject_id,ipd.industryproject_id`;

  connection.query(statement, (error, result) => {

    connection.end();
    response.send(utils.createResponse(error, result));
  })
});

module.exports = router