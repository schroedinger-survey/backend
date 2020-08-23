CREATE INDEX IF NOT EXISTS surveys_title_idx on surveys(title);

CREATE INDEX IF NOT EXISTS surveys_description_idx on surveys(description);

CREATE INDEX IF NOT EXISTS secured_submissions_token_id_idx on secured_submissions(token_id);

CREATE INDEX IF NOT EXISTS constrained_answers_constrained_questions_option_id_idx on constrained_answers(constrained_questions_option_id);