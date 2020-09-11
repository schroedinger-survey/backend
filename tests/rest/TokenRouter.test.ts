require("dotenv-flow").config({
    silent: true
});
import app from "../../src/app";
import {uuid} from "uuidv4";
import testUtils from "../TestUtils";
import tokenDB from "../../src/db/sql/TokenDB";
const {afterAll, describe, test, expect} = require("@jest/globals");
const supertest = require("supertest");
const request = supertest(app);


describe("Test Token API", () => {
    test("Create Token", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

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
        const createdSurvey = await request
            .post("/survey")
            .send(securedPayload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);
        const createdSurveyId = createdSurvey.body.id;


        const amount = 10;
        const createdTokens = await request
            .post("/token")
            .send({survey_id: createdSurveyId, amount: amount})
            .set("authorization", jwtToken);
        expect(createdTokens.status).toEqual(201);
        expect(createdTokens.body.length).toEqual(amount);

        for (let i = 0; i < createdTokens.body.length; i++) {
            const retrievedTokenFromDatabase = await tokenDB.getToken(createdTokens.body[i].id);
            expect(retrievedTokenFromDatabase.length).toEqual(1);
            expect(retrievedTokenFromDatabase[0].id).toEqual(createdTokens.body[i].id);
        }

        done();
    });


    test("Create token and retrieve secured surveys", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

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
        const createdSurvey = await request
            .post("/survey")
            .send(securedPayload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);
        const createdSurveyId = createdSurvey.body.id;


        const createdTokens = await request
            .post("/token")
            .send({survey_id: createdSurveyId, amount: 10})
            .set("authorization", jwtToken);
        expect(createdTokens.status).toEqual(201);
        expect(createdTokens.body.length).toEqual(10);

        const retrievedSurvey1 = await request
            .get(`/survey/public/${createdSurveyId}`);
        expect(retrievedSurvey1.status).toEqual(403);

        const retrievedSurvey2 = await request
            .get(`/survey/secured/${createdSurveyId}`);
        expect(retrievedSurvey2.status).toEqual(403);

        const retrievedSurvey3 = await request
            .get(`/survey/secured/${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(retrievedSurvey3.status).toEqual(200);

        for (let i = 0; i < 10; i++) {
            const retrievedSurvey4 = await request
                .get(`/survey/secured/${createdSurveyId}?token=${createdTokens.body[i].id}`);
            expect(retrievedSurvey4.status).toEqual(200);
        }
        for (let i = 0; i < 5; i++) {
            const retrievedSurvey5 = await request
                .get(`/survey/secured/${createdSurveyId}?token=${uuid()}`);
            expect(retrievedSurvey5.status).toEqual(403);
        }

        const username1 = uuid();
        const password1 = uuid();
        const email1 = uuid();
        const registerUser1 = await testUtils.registerUser(username1, `${email1}@mail.com`, password1);
        expect(registerUser1.status).toBe(201);

        const login1 = await testUtils.loginUser(username1, password1);
        expect(login1.status).toBe(200);

        const jwtToken1 = JSON.parse(login1.text).jwt;

        const retrievedSurvey6 = await request
            .get(`/survey/secured/${createdSurveyId}`)
            .set("authorization", jwtToken1);
        expect(retrievedSurvey6.status).toEqual(403);

        done();
    });


    test("Test create tokens and publish emails", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

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
        const createdSurvey = await request
            .post("/survey")
            .send(securedPayload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);
        const createdSurveyId = createdSurvey.body.id;

        const createdTokens = await request
            .post("/token/email")
            .send({survey_id: createdSurveyId, emails: ["test@longuyen.de", "test@larapollehn.de"]})
            .set("authorization", jwtToken);
        expect(createdTokens.status).toEqual(201);
        expect(createdTokens.body.length).toEqual(2);

        done();
    });

    test("Create token and delete tokens", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

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
        const createdSurvey = await request
            .post("/survey")
            .send(securedPayload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);
        const createdSurveyId = createdSurvey.body.id;


        const createdTokens = await request
            .post("/token")
            .send({survey_id: createdSurveyId, amount: 10})
            .set("authorization", jwtToken);
        expect(createdTokens.status).toEqual(201);
        expect(createdTokens.body.length).toEqual(10);

        const retrievedSurvey1 = await request
            .get(`/survey/public/${createdSurveyId}`);
        expect(retrievedSurvey1.status).toEqual(403);

        const retrievedSurvey2 = await request
            .get(`/survey/secured/${createdSurveyId}`);
        expect(retrievedSurvey2.status).toEqual(403);

        const retrievedSurvey3 = await request
            .get(`/survey/secured/${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(retrievedSurvey3.status).toEqual(200);

        for (let i = 0; i < 10; i++) {
            const retrievedSurvey4 = await request
                .get(`/survey/secured/${createdSurveyId}?token=${createdTokens.body[i].id}`);
            expect(retrievedSurvey4.status).toEqual(200);
        }


        for (let i = 0; i < 10; i++) {
            const retrievedSurvey4 = await request
                .delete(`/token/${createdTokens.body[i].id}`)
                .set("authorization", jwtToken);
            expect(retrievedSurvey4.status).toEqual(204);
        }

        for (let i = 0; i < 10; i++) {
            const retrievedSurvey4 = await request
                .get(`/survey/secured/${createdSurveyId}?token=${createdTokens.body[i].id}`);
            expect(retrievedSurvey4.status).toEqual(403);
        }

        done();
    });

    test("Test creating and retrieving tokens", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
        const registerUser = await testUtils.registerUser(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await testUtils.loginUser(username, password);
        expect(login.status).toBe(200);

        const jwtToken = JSON.parse(login.text).jwt;

        const userInfo1 = await request.post("/user/info").set("authorization", jwtToken);
        expect(userInfo1.status).toBe(200);

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
        const createdSurvey = await request
            .post("/survey")
            .send(securedPayload)
            .set("authorization", jwtToken);
        expect(createdSurvey.status).toEqual(201);
        const createdSurveyId = createdSurvey.body.id;


        const createdTokens = await request
            .post("/token")
            .send({survey_id: createdSurveyId, amount: 10})
            .set("authorization", jwtToken);
        expect(createdTokens.status).toEqual(201);
        expect(createdTokens.body.length).toEqual(10);

        for (let i = 0; i < 10; i++) {
            const retrievedSurvey4 = await request
                .get(`/survey/secured/${createdSurveyId}?token=${createdTokens.body[i].id}`);
            expect(retrievedSurvey4.status).toEqual(200);
        }

        const retrievedTokens1 = await request
            .get(`/token?survey_id=${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(retrievedTokens1.status).toEqual(200);
        expect(retrievedTokens1.body.length).toEqual(3);

        const retrievedTokens2 = await request
            .get(`/token?survey_id=${createdSurveyId}&page_size=100`)
            .set("authorization", jwtToken);
        expect(retrievedTokens2.status).toEqual(200);
        expect(retrievedTokens2.body.length).toEqual(10);

        const retrievedTokens3 = await request
            .get(`/token?survey_id=${createdSurveyId}&page_size=100&used=false`)
            .set("authorization", jwtToken);
        expect(retrievedTokens3.status).toEqual(200);
        expect(retrievedTokens3.body.length).toEqual(10);

        const retrievedTokens4 = await request
            .get(`/token?survey_id=${createdSurveyId}&page_size=100&used=true`)
            .set("authorization", jwtToken);
        expect(retrievedTokens4.status).toEqual(200);
        expect(retrievedTokens4.body.length).toEqual(0);

        const countTokens1 = await request
            .get(`/token/count?survey_id=${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(countTokens1.status).toEqual(200);
        expect(countTokens1.body.count).toEqual(10);

        const countTokens2 = await request
            .get(`/token/count?survey_id=${createdSurveyId}&used=true`)
            .set("authorization", jwtToken);
        expect(countTokens2.status).toEqual(200);
        expect(countTokens2.body.count).toEqual(0);

        const countTokens3 = await request
            .get(`/token/count?survey_id=${createdSurveyId}&used=false`)
            .set("authorization", jwtToken);
        expect(countTokens3.status).toEqual(200);
        expect(countTokens3.body.count).toEqual(10);


        const submission = {
            "survey_id": createdSurveyId,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": createdSurvey.body.constrained_questions[0].options[0].id
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission = await request
            .post(`/submission?token=${createdTokens.body[0].id}`)
            .send(submission);
        expect(createdSubmission.status).toEqual(201);

        const retrievedTokens5 = await request
            .get(`/token?survey_id=${createdSurveyId}&page_size=100`)
            .set("authorization", jwtToken);
        expect(retrievedTokens5.status).toEqual(200);
        expect(retrievedTokens5.body.length).toEqual(10);

        const retrievedTokens6 = await request
            .get(`/token?survey_id=${createdSurveyId}&page_size=100&used=false`)
            .set("authorization", jwtToken);
        expect(retrievedTokens6.status).toEqual(200);
        expect(retrievedTokens6.body.length).toEqual(9);

        const retrievedTokens7 = await request
            .get(`/token?survey_id=${createdSurveyId}&page_size=100&used=true`)
            .set("authorization", jwtToken);
        expect(retrievedTokens7.status).toEqual(200);
        expect(retrievedTokens7.body.length).toEqual(1);

        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});