CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users
(
    id              uuid                         DEFAULT uuid_generate_v4() PRIMARY KEY,
    username        VARCHAR(256) UNIQUE NOT NULL,
    hashed_password VARCHAR(256)        NOT NULL,
    email           VARCHAR(256) UNIQUE NOT NULL,
    created         DATE                NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS surveys
(
    id          uuid                  DEFAULT uuid_generate_v4() PRIMARY KEY,
    title       varchar(256) NOT NULL,
    description varchar(512) NOT NULL,
    start_date  DATE         NOT NULL DEFAULT CURRENT_DATE,
    end_date    DATE
        CONSTRAINT surveys_end_date_after_start_date CHECK (end_date IS NULL OR end_date < start_date ),
    secured     BOOLEAN               DEFAULT FALSE,
    user_id     uuid REFERENCES users (id) ON DELETE CASCADE,
    created     DATE         NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS tokens
(
    id        uuid          DEFAULT uuid_generate_v4() PRIMARY KEY,
    used      BOOLEAN       DEFAULT FALSE,
    used_date DATE,
    created   DATE NOT NULL DEFAULT CURRENT_DATE,
    survey_id uuid REFERENCES surveys (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS constrained_questions
(
    id            uuid             DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_text TEXT    NOT NULL,
    position      INTEGER NOT NULL,
    survey_id     uuid REFERENCES surveys (id) ON DELETE CASCADE,
    created       DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS constrained_questions_options
(
    id                      uuid             DEFAULT uuid_generate_v4() PRIMARY KEY,
    answer                  TEXT    NOT NULL,
    position                INTEGER NOT NULL,
    constrained_question_id uuid REFERENCES constrained_questions (id) ON DELETE CASCADE,
    created                 DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS freestyle_questions
(
    id            uuid             DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_text TEXT    NOT NULL,
    position      INTEGER NOT NULL,
    survey_id     uuid REFERENCES surveys (id) ON DELETE CASCADE,
    created       DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS submissions
(
    id        uuid          DEFAULT uuid_generate_v4() PRIMARY KEY,
    survey_id uuid REFERENCES surveys (id) ON DELETE CASCADE,
    created   DATE NOT NULL DEFAULT CURRENT_DATE

);

CREATE TABLE IF NOT EXISTS secured_submissions
(
    submission_id uuid REFERENCES submissions (id) PRIMARY KEY,
    token_id      uuid REFERENCES tokens (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS freestyle_answers
(
    answer               TEXT,
    submission_id        uuid REFERENCES submissions (id) ON DELETE CASCADE,
    freetext_question_id uuid REFERENCES freestyle_questions (id) ON DELETE CASCADE,
    created              DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (submission_id, freetext_question_id)
);

CREATE TABLE IF NOT EXISTS constrained_answers
(
    submission_id                   uuid REFERENCES submissions (id) ON DELETE CASCADE,
    constrained_question_id         uuid REFERENCES constrained_questions (id) ON DELETE CASCADE,
    constrained_questions_option_id uuid REFERENCES constrained_questions_options (id) ON DELETE CASCADE,
    created                         DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (submission_id, constrained_question_id)
);