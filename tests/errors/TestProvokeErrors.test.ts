require("dotenv-flow").config({
    silent: true
});
import app from "../../src/app";
import {v4 as uuid} from "uuid";
import testUtils from "../TestUtils";

const {afterAll, describe, test, expect} = require("@jest/globals");
const supertest = require("supertest");
const request = supertest(app);
const atob = require("atob");


describe("Test provoke for error in APIs", () => {
    test("Provoke errors in SurveyRouter", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();

        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

        const unsecuredPayload = {
            "title": "Experience when working with Schroedinger",
            "description": "The result of this survey is used to improve the user experience of this app",
            "secured": false,
            "constrained_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 1,
                    "options": [
                        {
                            "answer": "Very much",
                            "position": 1
                        },
                        {
                            "answer": "Not so",
                            "position": 2
                        }
                    ]
                }
            ],
            "freestyle_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 2
                }
            ]
        };
        const createdSurvey = await request
            .post("/survey")
            .send(unsecuredPayload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);

        const createdSurveyId = createdSurvey.body.id;

        const retrievedSurveyMalicious1 = await request
            .get(`/survey/public/${createdSurveyId.split("-").join("_")}`);
        expect(retrievedSurveyMalicious1.status).toEqual(500);

        const retrievedSurvey1 = await request
            .get(`/survey/public/${createdSurveyId}`);
        expect(retrievedSurvey1.status).toEqual(200);


        const securedPayload = {
            "title": "Experience when working with Schroedinger",
            "description": "The result of this survey is used to improve the user experience of this app",
            "secured": true,
            "constrained_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 1,
                    "options": [
                        {
                            "answer": "Very much",
                            "position": 1
                        },
                        {
                            "answer": "Not so",
                            "position": 2
                        }
                    ]
                }
            ],
            "freestyle_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 2
                }
            ]
        };
        const createdSurvey1 = await request
            .post("/survey")
            .send(securedPayload)
            .set("authorization", jwtToken);
        expect(createdSurvey1.status).toEqual(201);

        const createdSurveyId1 = createdSurvey1.body.id;
        const retrievedSurvey2 = await request
            .get(`/survey/public/${createdSurveyId1}`);
        expect(retrievedSurvey2.status).toEqual(403);

        const countAllSurveys = await request
            .get("/survey/all/count")
            .set("authorization", jwtToken);
        expect(countAllSurveys.status).toEqual(200);
        expect(countAllSurveys.body.count).toEqual(2);

        const retrieveAllSurveys = await request
            .get("/survey/all")
            .set("authorization", jwtToken);
        expect(retrieveAllSurveys.status).toEqual(200);
        expect(retrieveAllSurveys.body.length).toEqual(2);
        expect(retrieveAllSurveys.body[0].secured).toEqual(true);
        expect(retrieveAllSurveys.body[1].secured).toEqual(false);
        done();
    });

    test("Test delete secured survey", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

        const payload = {
            "title": "Experience when working with Schroedinger",
            "description": "The result of this survey is used to improve the user experience of this app",
            "secured": true,
            "constrained_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 1,
                    "options": [
                        {
                            "answer": "Very much",
                            "position": 1
                        },
                        {
                            "answer": "Not so",
                            "position": 2
                        }
                    ]
                }
            ],
            "freestyle_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 2
                }
            ]
        };
        const createdSurvey = await request
            .post("/survey")
            .send(payload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);

        const createdSurveyId = createdSurvey.body.id;

        const retrievedSurvey1 = await request
            .get(`/survey/secured/${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(retrievedSurvey1.status).toEqual(200);

        const deleteSurvey1 = await request
            .delete(`/survey/${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(deleteSurvey1.status).toEqual(204);

        const retrievedSurvey2 = await request
            .get(`/survey/secured/${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(retrievedSurvey2.status).toEqual(404);

        done();
    });


    test("Test delete public survey", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

        const payload = {
            "title": "Experience when working with Schroedinger",
            "description": "The result of this survey is used to improve the user experience of this app",
            "secured": false,
            "constrained_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 1,
                    "options": [
                        {
                            "answer": "Very much",
                            "position": 1
                        },
                        {
                            "answer": "Not so",
                            "position": 2
                        }
                    ]
                }
            ],
            "freestyle_questions": [
                {
                    "question_text": "Do cats have fluffy fur?",
                    "position": 2
                }
            ]
        };
        const createdSurvey = await request
            .post("/survey")
            .send(payload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);

        const createdSurveyId = createdSurvey.body.id;

        const retrievedSurvey1 = await request
            .get(`/survey/public/${createdSurveyId}`);
        expect(retrievedSurvey1.status).toEqual(200);
        expect(retrievedSurvey1.body.constrained_questions.length).toEqual(1);
        expect(retrievedSurvey1.body.freestyle_questions.length).toEqual(1);

        const payload1 = {
            "title": "Experience when working with Schroedinger",
            "description": "The result of this survey is used to improve the user experience of this app",
            "secured": false,
            "added_constrained_questions": [
                {
                    "question_text": "New added constrained question?",
                    "position": 3,
                    "options": [
                        {
                            "answer": "Very much",
                            "position": 1
                        },
                        {
                            "answer": "Not so",
                            "position": 2
                        }
                    ]
                }
            ],
            "added_freestyle_questions": [
                {
                    "question_text": "New added freestyle question?",
                    "position": 4
                }
            ],
            "deleted_constrained_questions": [],
            "deleted_freestyle_questions": []
        };
        const updatedSurvey1 = await request
            .put(`/survey/${createdSurveyId}`)
            .send(payload1)
            .set("authorization", jwtToken);
        expect(updatedSurvey1.status).toEqual(204);

        const retrievedSurvey2 = await request
            .get(`/survey/public/${createdSurveyId}`);
        expect(retrievedSurvey2.status).toEqual(200);
        expect(retrievedSurvey2.body.constrained_questions.length).toEqual(2);
        expect(retrievedSurvey2.body.freestyle_questions.length).toEqual(2);

        const newTitle = uuid();
        const newDescription = uuid();
        const newStartDate = new Date(retrievedSurvey2.body.start_date).getTime();
        const newEndDate = new Date(retrievedSurvey2.body.end_date).getTime();
        const payload2 = {
            "title": newTitle,
            "description": newDescription,
            "secured": true,
            "start_date": newStartDate,
            "end_date": newEndDate,
            "added_constrained_questions": [],
            "added_freestyle_questions": [],
            "deleted_constrained_questions": [
                {
                    "question_id": retrievedSurvey2.body.constrained_questions[0].id
                }
            ],
            "deleted_freestyle_questions": [
                {
                    "question_id": retrievedSurvey2.body.freestyle_questions[0].id
                }]
        };
        const updatedSurvey2 = await request
            .put(`/survey/${createdSurveyId}`)
            .send(payload2)
            .set("authorization", jwtToken);
        expect(updatedSurvey2.status).toEqual(204);

        const retrievedSurvey3 = await request
            .get(`/survey/secured/${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(retrievedSurvey3.status).toEqual(200);
        expect(retrievedSurvey3.body.constrained_questions.length).toEqual(1);
        expect(retrievedSurvey3.body.freestyle_questions.length).toEqual(1);

        const retrievedSurvey4 = await request
            .get(`/survey/public/${createdSurveyId}`);
        expect(retrievedSurvey4.status).toEqual(403);

        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});