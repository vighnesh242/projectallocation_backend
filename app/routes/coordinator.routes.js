var express = require("express");
var db = require('../config/db.config');
const utils = require('./utils');
const axios = require('axios');

const router = express.Router();
router.use(express.json())



//DomainPreferenceGraph
router.get('/DomainPreferenceGraph', (request, response) => {
  const connection = db.connect();


  const statement = `SELECT pd.Department_id,pd.Name as domainName,pd.domain_id,count(pg.Group_id) as count FROM project_group pg 
    LEFT JOIN project_domain pd ON pg.Domain_Pref_1=pd.Domain_id where pd.department_id=${utils.department} group by Domain_Pref_1`

  connection.query(statement, (error, result) => {
    connection.end();
    result = JSON.parse(JSON.stringify(result));

    var countdata = [];
    for (let i = 0; i < result.length; i++) {
      countdata[i] = result[i].count;
    }
    var namedata = [];
    for (let i = 0; i < result.length; i++) {
      namedata[i] = result[i].domainName;
    }

    console.log(countdata);
    var data = [countdata, namedata];
    console.log(data)
    response.send(utils.createResponse(error, data));
  })
});

//RegistrationReport
router.get('/RegistrationReport', (request, response) => {
  const connection = db.connect();
  const statement1 =
    `select count(l.Learner_id) as RegCount from learner l left JOIN person p on
  l.Person_id = p.Person_id where l.registered=1 and p.Department_id=${utils.department}`;

  connection.query(statement1, (error, result1) => {
    result1 = JSON.parse(JSON.stringify(result1));
    var regCount = result1[0].RegCount;
    const statement2 =
      `select count(l.Learner_id) as NonRegCount from learner l left JOIN person p on
      l.Person_id = p.Person_id where l.registered=0 and p.Department_id=${utils.department}`;

    connection.query(statement2, (error, result2) => {
      result2 = JSON.parse(JSON.stringify(result2));
      var nonRegCount = result2[0].NonRegCount;
      var data = [regCount, nonRegCount];
      response.send(utils.createResponse(error, data));
    })

  })
});


//RegistrationReportData
router.get('/RegistrationReportData', (request, response) => {
  const connection = db.connect();
  const statement =
    `select p.FullName, p.grno_EmpCode, d.Name, p.Mobile, p.Email from 
	  learner l left join person p on l.Person_id=p.Person_id 
    inner join department d on p.Department_id=d.Department_id
    WHERE l.registered=0 AND p.Department_id=${utils.department};`;

  connection.query(statement, (error, result) => {
    result = JSON.parse(JSON.stringify(result));
    response.send(utils.createResponse(error, result));
  })
});


//DONE
// Company registration into database by project coordinator
router.post("/CoordinatorIndustryProject", (req, res) => {
  var IndPrjID = "";
  const { CompanyName, Description, industryproject_domain_id, DueDate, FacultyRef, Links, industryproject_department_id } = req.body; //from front-end
  var Domain1 = industryproject_domain_id;
  var department_name = industryproject_department_id;
  const connection = db.connect();
  console.log(req.body);
  const statement = `insert into company(Company_name) SELECT '${CompanyName}' WHERE NOT EXISTS (Select Company_id from company where Company_name='${CompanyName}')`;
  connection.query(statement, (error, result) => {

    if (!error) {

      const statement = `select Company_id from company where Company_name='${CompanyName}'`;
      connection.query(statement, (error, result) => {
        result = JSON.parse(JSON.stringify(result));
        cmp_id = result[0].Company_id;
      })
      //Company_Id	CompanyName	Domain1	Domain2	Domain3	DueDate	Description	FacultyRef	Links	College_id visible
      var fact_statement = `select Instructor_id from instructor where Person_id=(select Person_id 
    from person WHERE grno_EmpCode ='${FacultyRef}')`;

      connection.query(fact_statement, (error, result) => {
        result = JSON.parse(JSON.stringify(result));

        let fact_id = result[0].Instructor_id;//store instructor_id
        console.log(fact_id);
        if (!error) {

          //insert all the industryprojects related details in the table
          const statement = ` insert into industryproject(Company_id,Description,DueDate,FacultyRef,Links,College_id,
                            visible) values ('${cmp_id}','${Description}',
                            '${DueDate}','${fact_id}','${Links}',"2",True)`;

          const connection = db.connect();
          connection.query(statement, (error, result) => {
            console.log(DueDate);
            /////////////////////////////////////
            // let IndPrjID = "";
            // SELECT industry_project_id FROM industryproject ORDER BY industry_project_id DESC LIMIT 0,1
            const statement = `SELECT industry_project_id FROM industryproject ORDER BY industry_project_id DESC LIMIT 0,1`;
            connection.query(statement, (error, result) => {
              result = JSON.parse(JSON.stringify(result));
              IndPrjID = result[0].industry_project_id;
              console.log(`IndustryProjectID=${IndPrjID}`)
              for (let i = 0; i < Domain1.length; i++) {
                console.log(IndPrjID)
                const statement = `insert INTO industryproject_domain (industryproject_id, Domain_id) VALUES (${IndPrjID},${Domain1[i]})`
                connection.query(statement, (error, result) => { });
                if (i == Domain1.length - 1) {
                  for (let j = 0; j < department_name.length; j++) {
                    const statement = `insert INTO industryproject_department (industryproject_id, Department_id) VALUES (${IndPrjID},${department_name[j]})`
                    connection.query(statement, (error, result) => { });
                    if (j == department_name.length - 1) {
                      connection.end();
                      res.send(utils.createResponse(error, result));
                    }
                  }
                }
              }
            });
          })
        }
      })
    }
  })
});











//DONE
//TO GET THE INDUSTRY PROJECTS ENTERED BY PROJECT CO-ORDINATOR 
router.get('/CoordinatorIndustryProject', (request, response) => {
  const connection = db.connect();

  //const statement = `select companyname,description,duedate,domain from company where visible="True"`;
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
  WHERE visible= True 
  GROUP BY ipdt.industryproject_id,ipd.industryproject_id
  `;

  connection.query(statement, (error, result) => {
    var data = [];
    data[0] = result;
    connection.end();
    response.send(utils.createResponse(error, result));
  })
});






//UPDATE THE GIVEN THE INDUSTRY Checked

router.put('/CoordinatorIndustryProject', (request, response) => {
  // INDUSTRYPROJECTS TABLE -  Company_Id CompanyName Domain1 Domain2 Domain3 DueDate Description FacultyRef Links College_id visible

  const connection = db.connect();
  const { CompanyName, industryproject_domain, industryproject_domain_id, industryproject_department, industryproject_department_id, department_name, Domain1,
    DueDate, Description, FacultyRef, Links, industry_project_id } = request.body; //from front-end

  //store instructor_id
  var fact_statement = `select Instructor_id from instructor where Person_id=(select Person_id from person
                          WHERE grno_EmpCode ='${FacultyRef}')`;
  connection.query(fact_statement, (error, result) => {
    result = JSON.parse(JSON.stringify(result));
    let fact_id = result[0].Instructor_id;
    console.log("Faculty ID :" + fact_id);
    if (!error) {

      //update the industry details by coordinator
      const statement = ` update industryproject set Description='${Description}',DueDate='${DueDate}',
      FacultyRef='${fact_id}',Links='${Links}' where industry_project_id= '${industry_project_id}'`;

      connection.query(statement, (error, result) => {

        const statement = `UPDATE industryproject_department SET Department_id=NULL WHERE industryproject_id=${industry_project_id}`;
        connection.query(statement, (error, result) => {

          for (let i = 0; i < industryproject_department_id.length; i++) {
            const statement = `INSERT INTO industryproject_department (industryproject_id,Department_id) 
              VALUES('${industry_project_id}','${industryproject_department_id[i]}')`;
            connection.query(statement, (error, result) => {
              if (i == industryproject_department_id.length - 1) {
                const statement = `UPDATE industryproject_domain SET Domain_id=NULL WHERE industryproject_id=${industry_project_id}`;
                connection.query(statement, (error, result) => {
                  for (let j = 0; j < industryproject_domain_id.length; j++) {
                    const statement = `INSERT INTO industryproject_domain (industryproject_id,Domain_id) 
                      VALUES('${industry_project_id}','${industryproject_domain_id[j]}')`;
                    connection.query(statement, (error, result) => {
                      if (i == industryproject_domain_id.length - 1) {
                        // connection.end();
                        // response.send(utils.createResponse(error, result));
                      }
                    })
                  }
                })
              }
            })
          }
        })
      })

    }
    // connection.end();
  response.send(utils.createResponse(error, result));
  })
});






//DONE
//API To delete company details from frontend only
router.put('/CoordinatorIndustryProject/:CompanyName', (request, response) => {
  const connection = db.connect();
  const { industry_project_id } = request.body;

  //Remove the industry 
  const statement = ` update industryproject set visible=false where industry_project_id='${industry_project_id}';`;


  connection.query(statement, (error, result) => {
    console.log(result);

    connection.end();
    response.send(utils.createResponse(error, result));
  })
});













router.get('/CoordinatorGroupDetails', (request, response) => {
  const connection = db.connect();

  //const statement = `select companyname,description,duedate,domain from company where visible="True"`;
  // const statement = `SELECT
  //   pg.Group_Name,
  //   pd.Name as final_domain,
  //   (select p1.FullName from person  as p1 where p1.Person_id=(SELECT person_id FROM instructor as i WHERE i.Instructor_id= pg.Instructor_id1 )) as instructor1,
  //   (select p1.FullName from person  as p1 where p1.Person_id=(SELECT person_id FROM instructor as i WHERE i.Instructor_id= pg.Instructor_id2 )) as instructor2,

  //   (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member1 )) as Member1,
  //   (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member1 )) as Member1name,
  //   (select Name from department where Department_id= (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member1 )))  as Member1Dept, 

  //   (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member2 )) as Member2,
  //   (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member2 )) as Member2name,
  //   (select Name from department where Department_id= (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member2 )))  as Member2Dept,

  //   (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member3 )) as Member3,
  //   (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member3 )) as Member3name, 
  //   (select Name from department where Department_id= (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member3 )))  as Member3Dept, 

  //   (select p.grno_EmpCode from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member4 )) as Member4,
  //   (select p.FullName from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member4 )) as Member4name,
  //   (select Name from department where Department_id= (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member4 )))  as Member4Dept 

  //   FROM
  //   project_group AS pg LEFT JOIN instructor as i on i.Instructor_id=pg.Instructor_id1 or i.Instructor_id=pg.Instructor_id2  
  //   LEFT JOIN person as p1 on i.Person_id=p1.Person_id
  //   INNER JOIN learner AS l ON l.group_id = pg.Group_id 
  //   INNER JOIN person AS p ON p.Person_id = l.Person_id 
  //   LEFT JOIN project_domain AS pd ON  pd.Domain_id = pg.final_domain 

  //   WHERE
  //    (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member1 ))='${utils.department}' OR
  //    (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member2 ))='${utils.department}' OR
  //    (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member3 ))='${utils.department}' OR
  //    (select p.Department_id from person as p where p.Person_id=(SELECT person_id FROM learner as l WHERE l.Learner_id= pg.member4 ))='${utils.department}' OR
  //    pg.Department_id='${utils.department}'
  //   GROUP BY pg.Group_Name`;


  const statement = `select pg.Group_Name  ,
    pd.Name as final_domain,
    (select p1.FullName from person  as p1 where p1.Person_id=(SELECT person_id FROM instructor as i WHERE i.Instructor_id= pg.Instructor_id1 )) as instructor1,
    (select p1.FullName from person  as p1 where p1.Person_id=(SELECT person_id FROM instructor as i WHERE i.Instructor_id= pg.Instructor_id2 )) as instructor2,
    p.grno_EmpCode,p.FullName,pd.Name,p.Mobile,p.Email
    from
    project_group as pg   
    JOIN department as d on d.Department_id=pg.Department_id
    JOIN instructor as i on i.Instructor_id=pg.Instructor_id1 
    JOIN person as p1 on i.Person_id=p1.Person_id
    JOIN learner as l ON l.group_id=pg.Group_id
    JOIN person as p ON p.Person_id=l.Person_id
    JOIN project_domain AS pd ON  pd.Domain_id = pg.final_domain
       
  
      WHERE
       d.Department_id='${utils.department}' OR
       pg.Department_id='${utils.department}'
       ORDER BY pg.Group_Name`;
  connection.query(statement, (error, result) => {
    connection.end();
    response.send(utils.createResponse(error, result));
  })
});


// select pg.Group_Name  ,
//     pd.Name as final_domain,
//     (select p1.FullName from person  as p1 where p1.Person_id=(SELECT person_id FROM instructor as i WHERE i.Instructor_id= pg.Instructor_id1 )) as instructor1,
//     (select p1.FullName from person  as p1 where p1.Person_id=(SELECT person_id FROM instructor as i WHERE i.Instructor_id= pg.Instructor_id2 )) as instructor2,
//     p.grno_EmpCode,p.FullName,pd.Name,p.Mobile,p.Email,d1.Name
//     from
//     project_group as pg   
//     JOIN department as d on d.Department_id=pg.Department_id    
//     JOIN instructor as i on i.Instructor_id=pg.Instructor_id1 
//     JOIN person as p1 on i.Person_id=p1.Person_id
//     JOIN learner as l ON l.group_id=pg.Group_id
//     JOIN person as p ON p.Person_id=l.Person_id
//     JOIN department as d1 on d1.Department_id=p.Department_id
//     JOIN project_domain AS pd ON  pd.Domain_id = pg.final_domain


//       WHERE
//        d.Department_id='2' OR
//        pg.Department_id='2'
//        ORDER BY pg.Group_Name

router.get('/CoordinatorGroupDetails/update', (request, response) => {
  const connection = db.connect();

  const statement = `select FullName,grno_EmpCode from person where Role_id=3`;

  connection.query(statement, (error, result) => {
    connection.end();
    response.send(utils.createResponse(error, result));
  })
});







//UPDATE GROUP DETAILS
router.put('/CoordinatorGroupDetails', (request, response) => {
  const connection = db.connect();

  const { final_domain, Member, Group_Name, instructor1, instructor2 } = request.body;
  //console.log(`${Member1}`+`${Member2}`+`${Member3}`+`${Member4}`+`${Group_Name}`+`${instructor1}`+`${instructor2}`+`${final_domain}`);


  if (!`${instructor2}`) {
    const memstatement = `update project_group set Instructor_id2= Null where Group_Name='${Group_Name}'`;
    connection.query(memstatement, (error, result) => {
      console.log(result);
    })
  }
  else {
    const fact_statement1 = `update project_group set Instructor_id2= (select Instructor_id from instructor where Person_id=(select Person_id from person WHERE 
      grno_EmpCode ='${instructor2}'))
    where Group_Name='${Group_Name}'`;
    connection.query(fact_statement1, (error, result) => {
      result = JSON.parse(JSON.stringify(result));
    })
  }
  //update domain and factulty  and members in project_group
  const statement4 = `update project_group set final_domain='${final_domain}',
                      Instructor_id1= (select Instructor_id from instructor where Person_id=(select Person_id from person WHERE grno_EmpCode ='${instructor1}'))
                      where Group_Name='${Group_Name}'`;

  connection.query(statement4, (error, result) => {
    console.log(result);
    connection.end();
    response.send(utils.createResponse(error, result));

  })

})

router.post("/CoordinatorGroupDetails", (request, response) => {
  const connection = db.connect();
  const { grno_EmpCode, Group_Name } = request.body;
  console.log(grno_EmpCode, Group_Name);

  const statement = `update learner as l set l.group_id= (SELECT group_id from project_group as pg WHERE pg.Group_Name = '${Group_Name}')
                      WHERE l.Person_id= (select Person_id from person WHERE  grno_EmpCode= '${grno_EmpCode}');`;

  connection.query(statement, (error, result) => {
    connection.end();
    response.send(utils.createResponse(error, result));
  });
});

router.put("/CoordinatorGroupDetails/:grno_EmpCode", (request, response) => {
  const connection = db.connect();
  const { grno_EmpCode } = request.body;
  console.log(grno_EmpCode);

  const statement = `update learner as l set l.group_id= Null WHERE l.Person_id= (select Person_id from person WHERE  grno_EmpCode= '${grno_EmpCode}')`;

  connection.query(statement, (error, result) => {
    connection.end();
    response.send(utils.createResponse(error, result));
  });
});





//UPDATE QUERY - WITH  MEMBERS INSIDE PROJECT GROUP
// router.put('/CoordinatorGroupDetails', (request, response) => {
//   const connection = db.connect();

//   const { final_domain, Member1, Member2, Member3, Member4, Group_Name, instructor1, instructor2 } = request.body;
//   console.log(`${Member1}`+`${Member2}`+`${Member3}`+`${Member4}`+`${Group_Name}`+`${instructor1}`+`${instructor2}`+`${final_domain}`);
//   if (!`${Member1}`) {
//     console.log("Inside 1st Member");
//     const memstatement = `update project_group set Member1= Null where Group_Name='${Group_Name}'`;
//     connection.query(memstatement, (error, result) => {
//       console.log(result);

//     })
//   }
//   if (!`${Member2}`) {
//     const memstatement = `update project_group set Member2= Null where Group_Name='${Group_Name}'`;
//     connection.query(memstatement, (error, result) => {
//       console.log(result);

//     })
//   }
//   if (!`${Member3}`) {
//     const memstatement = `update project_group set Member3= Null where Group_Name='${Group_Name}'`;
//     connection.query(memstatement, (error, result) => {
//       console.log(result);

//     })
//   }
//   if (!`${Member4}`) {
//     const memstatement = `update project_group set Member4= Null where Group_Name='${Group_Name}'`;
//     connection.query(memstatement, (error, result) => {
//       console.log(result);

//     })
//   }


//   if (!`${instructor2}`) {
//     const memstatement = `update project_group set Instructor_id2= Null where Group_Name='${Group_Name}'`;
//     connection.query(memstatement, (error, result) => {
//       console.log(result);

//     })
//   }
//   else {

//     const fact_statement1 = `update project_group set Instructor_id2= (select Instructor_id from instructor where Person_id=(select Person_id from person WHERE 
//       grno_EmpCode ='${instructor2}'))
//     where Group_Name='${Group_Name}'`;

//     connection.query(fact_statement1, (error, result) => {
//       result = JSON.parse(JSON.stringify(result));

//     })

//   }

//   console.log(`${instructor1}`);
//   //Store instructor_id
//   const fact_statement1 = `select Instructor_id from instructor where Person_id=(select Person_id from person WHERE 
//                             grno_EmpCode ='${instructor1}')`;


//   connection.query(fact_statement1, (error, result) => {
//     result = JSON.parse(JSON.stringify(result));
//     let fact_id1 = result[0].Instructor_id;
//     console.log("Faculty ID1 :" + fact_id1);

//     if (!error) {
//       //update the group id for students in learner table
//       const fact_statement2 = `update learner set Group_id=(select Group_id from project_group where Group_Name='${Group_Name}') 
//                                     where person_id in (select person_id from person where grno_EmpCode 
//                                     in ('${Member1}','${Member2}','${Member3}','${Member4}'));`;
//       connection.query(fact_statement2, (error, result) => {
//         console.log(result);
//         if (!error) {

//           //update the group_id null for the student removed 
//           const statement3 = `update learner set Group_id= Null where Group_id=(select Group_id from project_group where 
//                                   Group_Name='${Group_Name}') and Person_id  not in (select person_id from person where grno_EmpCode
//                                    in ('${Member1}','${Member2}','${Member3}','${Member4}'));`

//           connection.query(statement3, (error, result) => {
//             console.log(result);
//             if (!error) {

//               //update domain and factulty  and members in project_group
//               const statement4 = `update project_group set final_domain='${final_domain}',Instructor_id1='${fact_id1}'
//                                        where Group_Name='${Group_Name}'`;

//               connection.query(statement4, (error, result) => {
//                 console.log(result);
//                 if (!error) {

//                   const member = `UPDATE project_group SET  
//                                      Member1 =(SELECT learner_id FROM learner AS l INNER JOIN person AS p ON p.Person_id = l.Person_id 
//                                       WHERE grno_Empcode =('${Member1}')),
//                                      Member2 =(SELECT learner_id FROM learner AS l INNER JOIN person AS p ON p.Person_id = l.Person_id 
//                                      WHERE grno_Empcode =('${Member2}')),
//                                       Member3 =(SELECT learner_id FROM learner AS l INNER JOIN person AS p  ON p.Person_id = l.Person_id
//                                       WHERE grno_Empcode = ('${Member3}')),
//                                        Member4 =(SELECT learner_id FROM learner AS l INNER JOIN person AS p  ON p.Person_id = l.Person_id 
//                                         WHERE grno_Empcode =('${Member4}'))  WHERE   Group_Name = '${Group_Name}'`;

//                   connection.query(member, (error, result) => {
//                     console.log(result);


//                     connection.end();
//                     response.send(utils.createResponse(error, result));
//                   })
//                 }
//               })
//             }
//             else {
//               console.log("Statement3" + error);
//             }
//           })
//         }
//         else {
//           console.log("Statement2" + error);
//         }


//       })


//     }
//   })
// });


















//To Display Queries by students for Co-ordinator
router.get('/CoordinatorSupport', (request, response) => {
  //Support_id Group_id Learner_id Support_Description_id Resolved


  const connection = db.connect();

  const statement = `select pg.Group_Name, p.grno_EmpCode,p.FullName ,p.Mobile,p.Email,sd.Support_Description_Name 
    from support as s join support_reason as sd on s.Support_Description_id = sd.Support_Description_id 
    INNER JOIN learner as l on s.Learner_id=l.Learner_id 
    INNER JOIN person as p on p.Person_id=l.Person_id  
    INNER JOIN project_group as pg on pg.Group_id=l.group_id
    WHERE s.resolved = False and p.Department_id= '${utils.department}'; `;

  connection.query(statement, (error, result) => {
    connection.end();
    response.send(utils.createResponse(error, result));
  })
});








//query Responded or not API DONE
router.put('/CoordinatorSupport', (request, response) => {
  const connection = db.connect();
  const { grno_EmpCode } = request.body;
  console.log("Gr Number " + grno_EmpCode);

  const statement = ` update support set Resolved = True where Learner_id =(select Learner_id from learner
        where person_id=(select person_id from person where grno_EmpCode = '${grno_EmpCode}'))`;

  connection.query(statement, (error, result) => {
    connection.end();
    response.send(utils.createResponse(error, result));
  })
});


module.exports = router

// // remaining-checking
// //To Display all the details of students for co-ordinator
// router.get('/CoordinatorGroupDetails', (request, response) => {
//     var jsonObject = {};
//     key = 'detail';
//     jsonObject[key] = [];
//     const connection = db.connect();

//     const statement = `SELECT
//     pg.final_domain,
//     pg.Group_Name,
//     p.grno_EmpCode
// FROM
//     project_group AS pg
// INNER JOIN instructor AS i
// ON
//     i.Instructor_id = pg.Instructor_id1
// INNER JOIN person AS p
// ON
//     p.Person_id = i.Person_id
// GROUP BY
//     pg.Group_id
// `;
//     connection.query(statement, (error, result) => {
//         result = JSON.parse(JSON.stringify(result));
//         jsonObject[key].push(result)
//         console.log(jsonObject[key]);
//         if (!error) {
//             const statement2 = `select grno_EmpCode , FullName from person inner join instructor as i on i.Person_id_id=p.person_id inner join project_group as pg on pg.Group_id=i.Group_id);`;
//             connection.query(statement2, (error, result) => {
//                 result = JSON.parse(JSON.stringify(result));
//                 jsonObject[key].push(result)
//                 if (!error) {
//                     const statement3 = `select grno_EmpCode from person where Person_id =(select l.Person_id from learner as l inner join project_group as pg on pg.Group_id=l.Group_id);`;
//                     connection.query(statement3, (error, result) => {
//                         result = JSON.parse(JSON.stringify(result));
//                         jsonObject[key].push(result)
//                         connection.end();

//                         response.send(utils.createResponse(error, jsonObject[key]));
//                     })
//                 }
//             })
//         }

//     })
// });