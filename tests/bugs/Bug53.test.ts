require("dotenv-flow").config({
    silent: true
});
import app from "../../src/app";
import {uuid} from "uuidv4";
const {afterAll, describe, test, expect} = require("@jest/globals");
const supertest = require("supertest");
const {utilLogin, utilRegister} = require("../utils");
const request = supertest(app);

describe("Fix bug https://gitlab.com/Schroedinger1/backend/-/issues/53", () => {
    test("Fix bug 53", async (done) => {
        const username = uuid();
        const password = uuid();
        const email = uuid();
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
                            "answer": "Cats have much fluffy fur",
                            "position": 1
                        },
                        {
                            "answer": "Cats do not have such so fluffy fur",
                            "position": 2
                        }
                    ]
                },
                {
                    "question_text": "Do dogs have fluffy fur?",
                    "position": 2,
                    "options": [
                        {
                            "answer": "Dogs have much fluffy fur",
                            "position": 1
                        },
                        {
                            "answer": "Dogs do not have such so fluffy fur",
                            "position": 2
                        }
                    ]
                }
            ],
            "freestyle_questions": [
                {
                    "question_text": "Why do cats have fluffy fur?",
                    "position": 3
                },
                {
                    "question_text": "Why do dogs have fluffy fur?",
                    "position": 4
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
                },
                {
                    "constrained_question_id": createdSurvey.body.constrained_questions[1].id,
                    "constrained_questions_option_id": createdSurvey.body.constrained_questions[1].options[0].id
                }
            ],
            "freestyle_answers": [
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[0].id,
                    "answer": "Not that much, they scratch me often, so no."
                },
                {
                    "freestyle_question_id": createdSurvey.body.freestyle_questions[1].id,
                    "answer": "Very much, they are best friends of humans."
                }
            ]
        };
        const createdSubmission1 = await request
            .post("/submission")
            .send(submission1)
            .set("authorization", jwtToken);
        expect(createdSubmission1.status).toEqual(201);

        const createdSubmission2 = await request
            .post("/submission")
            .send(submission1)
            .set("authorization", jwtToken);
        expect(createdSubmission2.status).toEqual(201);

        const getSubmissions = await request
            .get(`/submission?survey_id=${createdSurveyId}`)
            .set("authorization", jwtToken);
        expect(getSubmissions.body.length).toBe(2);
        expect(getSubmissions.body[0].freestyle_answers.length).toBe(2);
        expect(getSubmissions.body[1].freestyle_answers.length).toBe(2);
        expect(getSubmissions.body[0].constrained_answers.length).toBe(2);
        expect(getSubmissions.body[1].constrained_answers.length).toBe(2);

        done();

    });


    afterAll(async (done) => {
        await app.close();
        done();
    });
});