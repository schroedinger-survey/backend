require("dotenv-flow").config({
    silent: true
});
const {afterAll, describe, test, expect} = require("@jest/globals");
const app = require("../../src/app");
const supertest = require("supertest");
const queryConvert = require("../../src/utils/QueryConverter");
const tokenDB = require("../../src/db/TokenDB");
const {v4: uuidv4} = require("uuid");
const {utilLogin, utilRegister} = require("../utils");
const request = supertest(app);


describe("Test Token API", () => {
    test("Create Token", async (done) => {
        const username = uuidv4();
        const password = uuidv4();
        const email = uuidv4();
        const registerUser = await utilRegister(username, `${email}@mail.com`, password);
        console.log(JSON.stringify(registerUser));
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


        const amount = 10;
        const createdTokens = await request
            .post("/token")
            .send({survey_id: createdSurveyId, amount: amount})
            .set("authorization", jwtToken);
        expect(createdTokens.status).toEqual(201);
        expect(createdTokens.body.length).toEqual(amount);

        for(let i = 0; i < createdTokens.body.length; i++){
            const retrievedTokenFromDatabase = queryConvert(await tokenDB.getToken(createdTokens.body[i].id));
            expect(retrievedTokenFromDatabase.length).toEqual(1);
            expect(retrievedTokenFromDatabase[0].id).toEqual(createdTokens.body[i].id);
        }

        done();
    });


    test("Create token and retrieve secured surveys", async (done) => {
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

        for(let i = 0; i < 10; i++) {
            const retrievedSurvey4 = await request
                .get(`/survey/secured/${createdSurveyId}?token=${createdTokens.body[i].id}`);
            expect(retrievedSurvey4.status).toEqual(200);
        }
        for(let i = 0; i < 5; i++) {
            const retrievedSurvey5 = await request
                .get(`/survey/secured/${createdSurveyId}?token=${uuidv4()}`);
            expect(retrievedSurvey5.status).toEqual(403);
        }

        const username1 = uuidv4();
        const password1 = uuidv4();
        const email1 = uuidv4();
        const registerUser1 = await utilRegister(username1, `${email1}@mail.com`, password1);
        expect(registerUser1.status).toBe(201);

        const login1 = await utilLogin(username1, password1);
        expect(login1.status).toBe(200);

        const jwtToken1 = JSON.parse(login1.text).jwt;

        const retrievedSurvey6 = await request
            .get(`/survey/secured/${createdSurveyId}`)
            .set("authorization", jwtToken1);
        expect(retrievedSurvey6.status).toEqual(403);

        done();
    });

    afterAll(async (done) => {
        await app.close();
        done();
    });
});