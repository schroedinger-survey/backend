import AbstractSqlDB from "./AbstractSqlDB";

class SubmissionDB extends AbstractSqlDB {
    createUnsecuredSubmission = (survey_id: string) => {
        return this.query(
            "INSERT INTO submissions(survey_id) VALUES ($1) RETURNING id",
            [survey_id.split("-").join("")]
        );
    }

    createSecuredSubmission = (submission_id: string, token_id: string) => {
        return this.query(
            "INSERT INTO secured_submissions(submission_id, token_id)values ($1, $2)",
            [submission_id.split("-").join(""), token_id.split("-").join("")]
        );
    }

    createConstrainedAnswer = (submission_id: string, constrained_question_id: string, constrained_questions_option_id: string) => {
        return this.query(
            "INSERT INTO constrained_answers(submission_id, constrained_question_id, constrained_questions_option_id) values($1, $2, $3)",
            [submission_id.split("-").join(""), constrained_question_id.split("-").join(""), constrained_questions_option_id.split("-").join("")]
        );
    }

    createFreestyleAnswer = (submission_id: string, freetext_question_id: string, answer: string) => {
        return this.query(
            "INSERT INTO freestyle_answers(submission_id, freetext_question_id, answer) values($1, $2, $3)",
            [submission_id.split("-").join(""), freetext_question_id.split("-").join(""), answer]
        );
    }

    getSubmissionById = async (user_id: string, submission_id: string) => {
        let jsons = await this.query(`
                    SELECT json_build_object(
                                   'id', sub.id,
                                   'survey_id', sub.survey_id,
                                   'created', sub.created,
                                   'last_edited', sub.last_edited,
                                   'constrained_answers', (SELECT json_agg(
                                                                          json_build_object(
                                                                                  'constrained_question_id', cq.id,
                                                                                  'constrained_questions_option_id', cqo.id,
                                                                                  'constrained_question_question_text',
                                                                                  cq.question_text,
                                                                                  'constrained_question_position', cq.position,
                                                                                  'constrained_question_chose_option',
                                                                                  cqo.answer,
                                                                                  'constrained_question_option_position',
                                                                                  cqo.position
                                                                              )
                                                                      )
                                                           FROM constrained_questions cq,
                                                                constrained_questions_options cqo,
                                                                constrained_answers ca
                                                           WHERE cq.survey_id = s.id
                                                             AND ca.submission_id = sub.id
                                                             AND ca.constrained_questions_option_id = cqo.id
                                                             AND ca.constrained_question_id = cq.id
                                                             AND cqo.constrained_question_id = cq.id
                                                           GROUP BY sub.id
                                   ),
                                   'freestyle_answers', (SELECT json_agg(
                                                                        json_build_object(
                                                                                'freestyle_question_question_text',
                                                                                fq.question_text,
                                                                                'freestyle_question_position', fq.position,
                                                                                'freestyle_question_answer', fa.answer
                                                                            )
                                                                    )
                                                         FROM freestyle_questions fq,
                                                              freestyle_answers fa
                                                         WHERE fq.survey_id = s.id
                                                           AND sub.survey_id = s.id
                                                           AND fa.freetext_question_id = fq.id
                                                           AND fa.submission_id = sub.id
                                                         GROUP BY sub.id
                                   )
                               ) AS result
                    FROM submissions sub,
                         surveys s,
                         users u
                    WHERE sub.survey_id = s.id
                      AND u.id = $1
                      AND sub.id = $2
                      AND s.user_id = u.id;
            `,
            [user_id.split("-").join(""), submission_id.split("-").join("")]
        );
        if (jsons.length === 1) {
            jsons = [jsons[0].result];
        }
        for(const json of jsons){
            if(json.constrained_answers === null){
                json.constrained_answers = [];
            }
            if(json.freestyle_answers === null){
                json.freestyle_answers = [];
            }
        }
        return jsons;
    }

    getSubmissions = async (user_id: string, survey_id: string, page_number: number, page_size: number) => {
        const jsons = await this.query(`
                    SELECT json_build_object(
                                   'id', sub.id,
                                   'survey_id', sub.survey_id,
                                   'created', sub.created,
                                   'last_edited', sub.last_edited,
                                   'constrained_answers', (SELECT json_agg(
                                                                          json_build_object(
                                                                                  'constrained_question_id', cq.id,
                                                                                  'constrained_questions_option_id', cqo.id,
                                                                                  'constrained_question_question_text',
                                                                                  cq.question_text,
                                                                                  'constrained_question_position', cq.position,
                                                                                  'constrained_question_chose_option',
                                                                                  cqo.answer,
                                                                                  'constrained_question_option_position',
                                                                                  cqo.position
                                                                              )
                                                                      )
                                                           FROM constrained_questions cq,
                                                                constrained_questions_options cqo,
                                                                constrained_answers ca
                                                           WHERE cq.survey_id = s.id
                                                             AND ca.submission_id = sub.id
                                                             AND ca.constrained_questions_option_id = cqo.id
                                                             AND ca.constrained_question_id = cq.id
                                                             AND cqo.constrained_question_id = cq.id
                                                           GROUP BY sub.id
                                   ),
                                   'freestyle_answers', (SELECT json_agg(
                                                                        json_build_object(
                                                                                'freestyle_question_question_text',
                                                                                fq.question_text,
                                                                                'freestyle_question_position', fq.position,
                                                                                'freestyle_question_answer', fa.answer
                                                                            )
                                                                    )
                                                         FROM freestyle_questions fq,
                                                              freestyle_answers fa
                                                         WHERE fq.survey_id = s.id
                                                           AND sub.survey_id = s.id
                                                           AND fa.freetext_question_id = fq.id
                                                           AND fa.submission_id = sub.id
                                                         GROUP BY sub.id
                                   )
                               ) AS result
                    FROM submissions sub,
                         surveys s,
                         users u
                    WHERE sub.survey_id = s.id
                      AND u.id = $1
                      AND s.id = $2
                      AND s.user_id = u.id
                    ORDER BY sub.created DESC
                    OFFSET $3 LIMIT $4;
            `,
            [user_id.split("-").join(""), survey_id.split("-").join(""), page_number * page_size, page_size]
        );
        const ret = [];
        for (const json of jsons) {
            ret.push(json.result);
        }
        for(const json of ret){
            if(json.constrained_answers === null){
                json.constrained_answers = [];
            }
            if(json.freestyle_answers === null){
                json.freestyle_answers = [];
            }
        }
        return ret;
    }

    countSubmissions = (user_id: string, survey_id: string) => {
        return this.query(`SELECT count(*)::integer
                           FROM submissions,
                                users,
                                surveys
                           WHERE users.id = $1
                             AND surveys.id = $2
                             AND surveys.user_id = users.id
                             AND submissions.survey_id = surveys.id;`,
            [user_id.split("-").join(""), survey_id.split("-").join("")]
        );
    }
}

const submissionDB = new SubmissionDB();
export default submissionDB;
