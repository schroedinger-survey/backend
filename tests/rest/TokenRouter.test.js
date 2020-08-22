require("dotenv-flow").config({
    silent: true
});
const {afterAll, describe, test, expect} = require("@jest/globals");
const app = require("../../app");
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

    afterAll(async (done) => {
        await app.close();
        done();
    });
});