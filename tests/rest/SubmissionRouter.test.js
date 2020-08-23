require("dotenv-flow").config({
    silent: true
});
const {afterAll, describe, test, expect} = require("@jest/globals");
const app = require("../../app");
const supertest = require("supertest");
const {v4: uuidv4} = require("uuid");
const {utilLogin, utilRegister} = require("../utils");
const request = supertest(app);

describe("Tests for submission API", () => {
    test("Test create secured surveys and sending submission", async (done) => {
        const username = uuidv4();
        const password = uuidv4();
        const email = uuidv4();
        const registerUser = await utilRegister(username, `${email}@mail.com`, password);
        expect(registerUser.status).toBe(201);

        const login = await utilLogin(username, password);
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
                    "constrained_questions_option_id": uuidv4()
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
                    "constrained_questions_option_id": uuidv4()
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": uuidv4(),
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
                    "constrained_question_id": uuidv4(),
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
            "survey_id": uuidv4(),
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
        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});