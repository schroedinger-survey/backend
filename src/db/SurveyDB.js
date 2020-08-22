const postgresDB = require("./PostgresDB");

class SurveyDB {
    constructor() {
        this.createSurvey = this.createSurvey.bind(this);
        this.getSurvey = this.getSurvey.bind(this);
        this.searchPublicSurveys = this.searchPublicSurveys.bind(this);
        this.countPublicSurveys = this.countPublicSurveys.bind(this);
        this.searchSecuredSurveys = this.searchSecuredSurveys.bind(this);
        this.countSecuredSurveys = this.countSecuredSurveys.bind(this);
    }

    createSurvey(title, description, startDate, endDate, secured, userId) {
        const insertSurvey = {
            name: "create-survey",
            text: "INSERT INTO surveys(title, description, start_date, end_date, secured, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            values: [title, description, startDate, endDate, secured, userId.split("-").join("")]
        };
        return postgresDB.query(insertSurvey);
    }

    getSurveyByIdAndUserId(id, userId) {
        const selectQuery = {
            rowMode: "array",
            name: "get-survey-by-id-and-user-id",
            text: "SELECT * FROM surveys where id = $1 AND user_id = $2",
            values: [id.split("-").join(""), userId.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }

    getSurvey(id) {
        const selectQuery = {
            rowMode: "array",
            name: "get-survey",
            text: "SELECT * FROM surveys where id = $1",
            values: [id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }

    searchPublicSurveys(title, description, startDate, endDate, pageNumber, pageSize) {
        const selectQuery = {
            rowMode: "array",
            name: "search-public-survey",
            text: `WITH args (title, description, start_date, end_date) as (VALUES ($1, $2, CAST($3 as Date), CAST($4 as Date)))
            SELECT surveys.id FROM surveys, args
            WHERE (surveys.secured is false)
            AND (args.title IS NULL OR surveys.title LIKE args.title) 
            AND (args.start_date IS NULL OR surveys.start_date > args.start_date)
            AND (args.end_date IS NULL OR surveys.end_date < args.start_date) 
            ORDER BY id DESC OFFSET $5  LIMIT $6;`,
            values: [title, description, startDate, endDate, pageNumber * pageSize, pageSize]
        };
        return postgresDB.query(selectQuery);
    }

    countPublicSurveys(title, description, startDate, endDate) {
        const selectQuery = {
            rowMode: "array",
            name: "count-public-survey",
            text: `WITH args (title, description, start_date, end_date) as (VALUES ($1, $2, CAST($3 as Date), CAST($4 as Date)))
            SELECT count(surveys.id)::integer FROM surveys, args
            WHERE (surveys.secured is false)
            AND (args.title IS NULL OR surveys.title LIKE args.title) 
            AND (args.start_date IS NULL OR surveys.start_date > args.start_date)
            AND (args.end_date IS NULL OR surveys.end_date < args.start_date);`,
            values: [title, description, startDate, endDate]
        };
        return postgresDB.query(selectQuery);
    }


    searchSecuredSurveys(title, description, startDate, endDate, pageNumber, pageSize, userId) {
        const selectQuery = {
            rowMode: "array",
            name: "search-secured-survey",
            text: `WITH args (title, description, start_date, end_date) as (VALUES ($1, $2, CAST($3 as Date), CAST($4 as Date)))
            SELECT surveys.id FROM surveys, args, users 
            WHERE users.id = $5
            AND surveys.user_id = users.id
            AND (surveys.secured is true)
            AND (args.title IS NULL OR surveys.title LIKE args.title) 
            AND (args.start_date IS NULL OR surveys.start_date > args.start_date)
            AND (args.end_date IS NULL OR surveys.end_date < args.start_date)
            ORDER BY surveys.id DESC OFFSET $6 LIMIT $7;`,
            values: [title, description, startDate, endDate, userId.split("-").join(""), pageNumber * pageSize, pageSize]
        };
        return postgresDB.query(selectQuery);
    }

    countSecuredSurveys(title, description, startDate, endDate, userId) {
        const selectQuery = {
            rowMode: "array",
            name: "count-secured-survey",
            text: `WITH args (title, description, start_date, end_date) as (VALUES ($1, $2, CAST($3 as Date), CAST($4 as Date)))
            SELECT count(surveys.id)::integer FROM surveys, args, users 
            WHERE users.id = $5
            AND surveys.user_id = users.id
            AND (surveys.secured is true)
            AND (args.title IS NULL OR surveys.title LIKE args.title) 
            AND (args.start_date IS NULL OR surveys.start_date > args.start_date)
            AND (args.end_date IS NULL OR surveys.end_date < args.start_date);`,
            values: [title, description, startDate, endDate, userId.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }
}

const surveyDB = new SurveyDB();
module.exports = surveyDB;