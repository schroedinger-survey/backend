import {log} from "util";

require("dotenv-flow").config({
    silent: true
});
import app from "../../src/app";
import {uuid} from "uuidv4";
import testUtils from "../utils";
const {afterAll, describe, test, expect} = require("@jest/globals");
const supertest = require("supertest");
const request = supertest(app);
const atob = require('atob');


describe("Tests for survey API", () => {
    test("Create survey without token should fail", async (done) => {
        const createSurveyWithoutToken = await request.post("/survey");
        expect(createSurveyWithoutToken.status).toEqual(403);
        done();
    });

    test("Survey creation should validate request body", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.utilLogin(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;
        const createSurvey1 = await request
            .post("/survey")
            .set("authorization", jwtToken);
        expect(createSurvey1.status).toEqual(422);


        const validPayload = {
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
        const createSurvey2 = await request
            .post("/survey")
            .send(validPayload)
            .set("authorization", jwtToken);
        expect(createSurvey2.status).toEqual(201);
        const body = JSON.parse(createSurvey2.text);
        expect(body.title).toEqual(validPayload.title);
        expect(body.description).toEqual(validPayload.description);
        expect(body.secured).toEqual(validPayload.secured);
        expect(body.constrained_questions.length).toEqual(1);
        expect(body.freestyle_questions.length).toEqual(1);
        expect(body.freestyle_questions[0].question_text).toEqual(validPayload.freestyle_questions[0].question_text);
        expect(body.freestyle_questions[0].position).toEqual(validPayload.freestyle_questions[0].position);
        expect(body.constrained_questions[0].question_text).toEqual(validPayload.constrained_questions[0].question_text);
        expect(body.constrained_questions[0].position).toEqual(validPayload.constrained_questions[0].position);
        expect(body.constrained_questions[0].options.length).toEqual(validPayload.constrained_questions[0].options.length);
        expect(body.constrained_questions[0].options[0].answer).toEqual(validPayload.constrained_questions[0].options[0].answer);
        expect(body.constrained_questions[0].options[0].position).toEqual(validPayload.constrained_questions[0].options[0].position);
        expect(body.constrained_questions[0].options[1].answer).toEqual(validPayload.constrained_questions[0].options[1].answer);
        expect(body.constrained_questions[0].options[1].position).toEqual(validPayload.constrained_questions[0].options[1].position);

        const createSurvey3 = await request
            .post("/survey")
            .send({
                "title": "Experience when working with Schroedinger",
                "description": "The result of this survey is used to improve the user experience of this app",
                "secured": false,
                "constrained_questions": [],
                "freestyle_questions": []
            })
            .set("authorization", jwtToken);
        expect(createSurvey3.status).toEqual(400);


        const createSurvey4 = await request
            .post("/survey")
            .send({
                "title": "Experience when working with Schroedinger",
                "description": "The result of this survey is used to improve the user experience of this app",
                "secured": false,
                "constrained_questions": [
                    {
                        "question_text": "Do cats have fluffy fur?",
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
            })
            .set("authorization", jwtToken);
        expect(createSurvey4.status).toEqual(422);

        done();
    });

    test("Test search public surveys", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.utilLogin(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;
        const userId = JSON.parse(atob(jwtToken.split(".")[1])).id

        const validPayload = {
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
        for (let i = 0; i < 20; i++) {
            const createdSurvey = await request
                .post("/survey")
                .send(validPayload)
                .set("authorization", jwtToken);
            expect(createdSurvey.status).toEqual(201);
        }

        const searchSurvey1 = await request.get("/survey/public");
        expect(JSON.parse(searchSurvey1.text).length).toEqual(5);

        const searchSurvey2 = await request.get("/survey/public?page_size=10");
        expect(JSON.parse(searchSurvey2.text).length).toEqual(10);


        const randomTitle = uuid();
        const validPayload2 = {
            "title": randomTitle,
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
            .send(validPayload2)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);

        const searchSurvey3 = await request.get(`/survey/public?page_size=10&title=${randomTitle}`);
        expect(searchSurvey3.body.length).toEqual(1);

        const countSurvey1 = await request.get(`/survey/public/count?title=${randomTitle}`);
        expect(countSurvey1.body.count).toEqual(1);

        const countSurvey2 = await request.get(`/survey/public/count?title=${randomTitle}&user_id=${userId}`);
        expect(countSurvey2.body.count).toEqual(1);

        done();
    });


    test("Test search secured surveys", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.utilLogin(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

        const validPayload = {
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
        for (let i = 0; i < 20; i++) {
            const createdSurvey = await request
                .post("/survey")
                .send(validPayload)
                .set("authorization", jwtToken);
            expect(createdSurvey.status).toEqual(201);
        }

        const searchSurvey1 = await request.get("/survey/secured").set("authorization", jwtToken);
        expect(searchSurvey1.body.length).toEqual(5);

        const searchSurvey2 = await request.get("/survey/secured?page_size=10").set("authorization", jwtToken);
        expect(searchSurvey2.body.length).toEqual(10);

        const randomTitle = uuid();
        const validPayload2 = {
            "title": randomTitle,
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
            .send(validPayload2)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);

        const searchSurvey3 = await request.get(`/survey/secured?page_size=10&title=${randomTitle}`).set("authorization", jwtToken);
        expect(searchSurvey3.status).toEqual(200);
        expect(searchSurvey3.body.length).toEqual(1);

        const countSurvey1 = await request.get(`/survey/secured/count?title=${randomTitle}`).set("authorization", jwtToken);
        expect(countSurvey1.status).toEqual(200);
        expect(countSurvey1.body.count).toEqual(1);

        const countSurvey2 = await request.get("/survey/secured/count").set("authorization", jwtToken);
        expect(countSurvey2.status).toEqual(200);
        expect(countSurvey2.body.count).toEqual(21);

        const username1 = uuid();
        const password1 = uuid();
        const email1 = uuid();
        const registerUser1 = await testUtils.utilRegister(username1, `${email1}@mail.com`, password1);
        expect(registerUser1.status).toBe(201);

        const login1 = await testUtils.utilLogin(username1, password1);
        expect(login1.status).toBe(200);

        const jwtToken1 = JSON.parse(login1.text).jwt;

        const countSurvey3 = await request.get("/survey/secured/count").set("authorization", jwtToken1);
        expect(countSurvey3.body.count).toEqual(0);

        done();
    });

    test("Test retrieve unsecured and secured surveys", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.utilLogin(username, password);
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
        done();
    });

    test("Test delete secured survey", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.utilLogin(username, password);
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
        const registerUser = await testUtils.utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.utilLogin(username, password);
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
        const newStartDate = retrievedSurvey2.body.start_date;
        const newEndDate = retrievedSurvey2.body.end_date;
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