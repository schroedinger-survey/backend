CREATE INDEX IF NOT EXISTS users_zombodb_index ON users USING zombodb ((users.*));

CREATE INDEX IF NOT EXISTS surveys_zombodb_index ON surveys USING zombodb ((surveys.*));

CREATE INDEX IF NOT EXISTS constrained_questions_zombodb_index ON constrained_questions USING zombodb ((constrained_questions.*));

CREATE INDEX IF NOT EXISTS constrained_questions_options_zombodb_index ON constrained_questions_options USING zombodb ((constrained_questions_options.*));

CREATE INDEX IF NOT EXISTS freestyle_questions_zombodb_index ON freestyle_questions USING zombodb ((freestyle_questions.*));

CREATE INDEX IF NOT EXISTS freestyle_answers_zombodb_index ON freestyle_answers USING zombodb ((freestyle_answers.*));