var express = require("express");
var db = require('../config/db.config');
const utils = require('./utils');
const axios = require('axios');
const { response } = require("express");

const router = express.Router();
router.use(express.json())

//API for Allocation
router.post("/Allocate", (req, res) => {
    console.log("Allocation Started");

    const DomainStatement = `select * from project_domain where college_id=2;`; //colege id is hard coded to 2(VIIT)
    var Domain = [];
    const connection = db.connect();

    var key = 'detail';
    var InstInfo = {};
    InstInfo[key] = [];
    var GrpInfo = {};
    GrpInfo[key] = [];

    //loop assigning variables
    var InsructortCount = 0;
    var GroupCount = 0;
    var TempInst = 0;
    var FinalInst = 0;
    var FinalGroup = 0;

    connection.query(DomainStatement, (error, result) => {
        result = JSON.parse(JSON.stringify(result));
        Domain = result;

        for (let i = 1; i <= Domain.length; i++) {
            const InstructorStatement = `select row_number() over ( partition by instructor.Domain_Pref_1) as sr_no,
                                        instructor.Instructor_id, instructor.Domain_Pref_1 from instructor INNER JOIN 
                                        person on instructor.Person_id=person.Person_id where person.College_id=1 
                                        and instructor.registered=1 and domain_pref_1=${i}`;

            connection.query(InstructorStatement, (error, result) => {
                result = JSON.parse(JSON.stringify(result));
                InstInfo[key].push(result)
            });
        }

        for (let i = 1; i <= Domain.length; i++) {
            const ProjectGroupStatement = `select row_number() over ( partition by project_group.Domain_Pref_1) as sr_no,
                                        project_group.Group_id, project_group.Domain_Pref_1 from project_group where 
                                        project_group.Domain_Pref_1=${i}`;
                                        
            connection.query(ProjectGroupStatement, (error, result) => {
                result = JSON.parse(JSON.stringify(result));
                GrpInfo[key].push(result)
                if (i == Domain.length) {

                    //Code for allocation is written below
                    for (let j = 1; j <= Domain.length; j++) {
                        InsructortCount = InstInfo[key][j - 1].length;
                        GroupCount = GrpInfo[key][j - 1].length;

                        for (let k = 1; k <= GroupCount; k++) {
                            TempInst = (k - 1) % InsructortCount;
                            FinalInst = InstInfo[key][j - 1][TempInst].Instructor_id;
                            FinalGroup = GrpInfo[key][j - 1][k - 1].Group_id;

                            const AllocateStatment = `update project_group set project_group.Instructor_id1=${FinalInst},
                                                    project_group.final_domain=${j} where project_group.Group_id=${FinalGroup};`

                            connection.query(AllocateStatment, (error, result) => {

                                if (!error) {
                                    console.log('updated successfully')
                                }
                                else {
                                    console.log(error)
                                }
                            });
                        }
                    }
                }
            });
        }
    });

});

module.exports = router