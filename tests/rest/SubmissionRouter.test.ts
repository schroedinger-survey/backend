require("dotenv-flow").config({
    silent: true
});
import app from "../../src/app";
import {uuid} from "uuidv4";
import testUtils from "../TestUtils";
const {afterAll, describe, test, expect} = require("@jest/globals");
const supertest = require("supertest");
const request = supertest(app);

describe("Tests for submission API", () => {
    test("Test create secured surveys and sending submission", async (done) => {
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

        const submission1 = {
            "survey_id": createdSurvey.body.id,
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
        const createdSubmission1 = await request
            .post("/submission")
            .send(submission1)
            .set("authorization", jwtToken);
        expect(createdSubmission1.status).toEqual(201);

        const submission2 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": createdSurvey.body.constrained_questions[0].options[1].id
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission2 = await request
            .post("/submission")
            .send(submission2)
            .set("authorization", jwtToken);
        expect(createdSubmission2.status).toEqual(201);

        const submission3 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": uuid()
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission3 = await request
            .post("/submission")
            .send(submission3)
            .set("authorization", jwtToken);
        expect(createdSubmission3.status).toEqual(400);


        const submission4 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": uuid()
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": uuid(),
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission4 = await request
            .post("/submission")
            .send(submission4)
            .set("authorization", jwtToken);
        expect(createdSubmission4.status).toEqual(400);

        const submission5 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": uuid(),
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
        const createdSubmission5 = await request
            .post("/submission")
            .send(submission5)
            .set("authorization", jwtToken);
        expect(createdSubmission5.status).toEqual(400);

        const submission6 = {
            "survey_id": uuid(),
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
        const createdSubmission6 = await request
            .post("/submission")
            .send(submission6)
            .set("authorization", jwtToken);
        expect(createdSubmission6.status).toEqual(400);


        const submission7 = {
            "survey_id": createdSurvey.body.id,
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

        const createdSubmission7 = await request
            .post(`/submission?token=${createdTokens.body[0].id}`)
            .send(submission7);
        expect(createdSubmission7.status).toEqual(201);

        const retrievedSubmissions = await request
            .get(`/submission?survey_id=${createdSurveyId}`)
            .send()
            .set("authorization", jwtToken);
        expect(retrievedSubmissions.status).toEqual(200);
        expect(retrievedSubmissions.body.length).toEqual(3);
        for (const retrievedSubmission of retrievedSubmissions.body) {
            expect(retrievedSubmission.survey_id).toEqual(createdSurveyId);
            expect(retrievedSubmission.constrained_answers.length).toEqual(1);
            expect(retrievedSubmission.freestyle_answers.length).toEqual(1);
            expect(retrievedSubmission.constrained_answers[0].constrained_question_question_text).toEqual(securedPayload.constrained_questions[0].question_text);
            expect(retrievedSubmission.freestyle_answers[0].freestyle_question_question_text).toEqual(securedPayload.freestyle_questions[0].question_text);
            expect(retrievedSubmission.constrained_answers[0].hasOwnProperty("constrained_question_chose_option")).toBe(true);
            expect(retrievedSubmission.freestyle_answers[0].hasOwnProperty("freestyle_question_answer")).toBe(true);
        }

        const countSubmissions = await request
            .get(`/submission/count?survey_id=${createdSurveyId}`)
            .send()
            .set("authorization", jwtToken);
        expect(countSubmissions.status).toEqual(200);
        expect(countSubmissions.body.count).toEqual(3);
        done();
    });
    test("Test create secured surveys, sending and retrieving submission", async (done) => {
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

        const submission1 = {
            "survey_id": createdSurvey.body.id,
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
        const createdSubmission1 = await request
            .post("/submission")
            .send(submission1)
            .set("authorization", jwtToken);
        expect(createdSubmission1.status).toEqual(201);

        const submission2 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": createdSurvey.body.constrained_questions[0].options[1].id
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission2 = await request
            .post("/submission")
            .send(submission2)
            .set("authorization", jwtToken);
        expect(createdSubmission2.status).toEqual(201);

        const submission3 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": uuid()
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission3 = await request
            .post("/submission")
            .send(submission3)
            .set("authorization", jwtToken);
        expect(createdSubmission3.status).toEqual(400);


        const submission4 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": uuid()
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": uuid(),
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission4 = await request
            .post("/submission")
            .send(submission4)
            .set("authorization", jwtToken);
        expect(createdSubmission4.status).toEqual(400);

        const submission5 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": uuid(),
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
        const createdSubmission5 = await request
            .post("/submission")
            .send(submission5)
            .set("authorization", jwtToken);
        expect(createdSubmission5.status).toEqual(400);

        const submission6 = {
            "survey_id": uuid(),
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
        const createdSubmission6 = await request
            .post("/submission")
            .send(submission6)
            .set("authorization", jwtToken);
        expect(createdSubmission6.status).toEqual(400);


        const submission7 = {
            "survey_id": createdSurvey.body.id,
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

        const createdSubmission7 = await request
            .post(`/submission?token=${createdTokens.body[0].id}`)
            .send(submission7);
        expect(createdSubmission7.status).toEqual(201);

        const retrievedSubmissions = await request
            .get(`/submission?survey_id=${createdSurveyId}`)
            .send()
            .set("authorization", jwtToken);
        expect(retrievedSubmissions.status).toEqual(200);
        expect(retrievedSubmissions.body.length).toEqual(3);
        for (const retrievedSubmission of retrievedSubmissions.body) {
            expect(retrievedSubmission.survey_id).toEqual(createdSurveyId);
            expect(retrievedSubmission.constrained_answers.length).toEqual(1);
            expect(retrievedSubmission.freestyle_answers.length).toEqual(1);
            expect(retrievedSubmission.constrained_answers[0].constrained_question_question_text).toEqual(securedPayload.constrained_questions[0].question_text);
            expect(retrievedSubmission.freestyle_answers[0].freestyle_question_question_text).toEqual(securedPayload.freestyle_questions[0].question_text);
            expect(retrievedSubmission.constrained_answers[0].hasOwnProperty("constrained_question_chose_option")).toBe(true);
            expect(retrievedSubmission.freestyle_answers[0].hasOwnProperty("freestyle_question_answer")).toBe(true);
        }

        const countSubmissions = await request
            .get(`/submission/count?survey_id=${createdSurveyId}`)
            .send()
            .set("authorization", jwtToken);
        expect(countSubmissions.status).toEqual(200);
        expect(countSubmissions.body.count).toEqual(3);
        done();


        const retrievedSubmission1 = await request
            .get(`/submission/${retrievedSubmissions.body[0].id}`)
            .send()
            .set("authorization", jwtToken);
        expect(retrievedSubmission1.status).toEqual(200);

        expect(retrievedSubmission1.body).toEqual(retrievedSubmissions.body[0])

        done();
    });


    test("Test create secured surveys and sending submission. After that the surveys will be deleted and nothing can be retrieved.", async (done) => {
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

        const submission1 = {
            "survey_id": createdSurvey.body.id,
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
        const createdSubmission1 = await request
            .post("/submission")
            .send(submission1)
            .set("authorization", jwtToken);
        expect(createdSubmission1.status).toEqual(201);

        const submission2 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": createdSurvey.body.constrained_questions[0].options[1].id
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission2 = await request
            .post("/submission")
            .send(submission2)
            .set("authorization", jwtToken);
        expect(createdSubmission2.status).toEqual(201);

        const submission3 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": uuid()
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission3 = await request
            .post("/submission")
            .send(submission3)
            .set("authorization", jwtToken);
        expect(createdSubmission3.status).toEqual(400);


        const submission4 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[0].id,
                    "constrained_questions_option_id": uuid()
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": uuid(),
                    "answer": "Not that much, they scratch me often,so no"
                }
            ]
        };
        const createdSubmission4 = await request
            .post("/submission")
            .send(submission4)
            .set("authorization", jwtToken);
        expect(createdSubmission4.status).toEqual(400);

        const submission5 = {
            "survey_id": createdSurvey.body.id,
            "constrained_answers": [
                {
                    "constrained_question_id": uuid(),
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
        const createdSubmission5 = await request
            .post("/submission")
            .send(submission5)
            .set("authorization", jwtToken);
        expect(createdSubmission5.status).toEqual(400);

        const submission6 = {
            "survey_id": uuid(),
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
        const createdSubmission6 = await request
            .post("/submission")
            .send(submission6)
            .set("authorization", jwtToken);
        expect(createdSubmission6.status).toEqual(400);


        const submission7 = {
            "survey_id": createdSurvey.body.id,
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

        const createdSubmission7 = await request
            .post(`/submission?token=${createdTokens.body[0].id}`)
            .send(submission7);
        expect(createdSubmission7.status).toEqual(201);

        const retrievedSubmissions = await request
            .get(`/submission?survey_id=${createdSurveyId}`)
            .send()
            .set("authorization", jwtToken);
        expect(retrievedSubmissions.status).toEqual(200);
        expect(retrievedSubmissions.body.length).toEqual(3);
        for (const retrievedSubmission of retrievedSubmissions.body) {
            expect(retrievedSubmission.survey_id).toEqual(createdSurveyId);
            expect(retrievedSubmission.constrained_answers.length).toEqual(1);
            expect(retrievedSubmission.freestyle_answers.length).toEqual(1);
            expect(retrievedSubmission.constrained_answers[0].constrained_question_question_text).toEqual(securedPayload.constrained_questions[0].question_text);
            expect(retrievedSubmission.freestyle_answers[0].freestyle_question_question_text).toEqual(securedPayload.freestyle_questions[0].question_text);
            expect(retrievedSubmission.constrained_answers[0].hasOwnProperty("constrained_question_chose_option")).toBe(true);
            expect(retrievedSubmission.freestyle_answers[0].hasOwnProperty("freestyle_question_answer")).toBe(true);
        }

        const countSubmissions = await request
            .get(`/submission/count?survey_id=${createdSurveyId}`)
            .send()
            .set("authorization", jwtToken);
        expect(countSubmissions.status).toEqual(200);
        expect(countSubmissions.body.count).toEqual(3);


        const deleteSurvey1 = await request
            .delete(`/survey/${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(deleteSurvey1.status).toEqual(204);

        const countSubmissions1 = await request
            .get(`/submission/count?survey_id=${createdSurveyId}`)
            .send()
            .set("authorization", jwtToken);
        expect(countSubmissions1.status).toEqual(200);
        expect(countSubmissions1.body.count).toEqual(0);

        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});