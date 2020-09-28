import AbstractSqlDB from "./AbstractSqlDB";

class ConstrainedQuestionDB extends AbstractSqlDB{
    createConstrainedQuestion = (question_text: string, position: number, survey_id: string) => {
        return this.query(
            "INSERT INTO constrained_questions(question_text, position, survey_id) VALUES ($1, $2, $3) RETURNING id",
            [question_text, position, survey_id.split("-").join("")]
        );
    }

    deleteConstrainedQuestion = (question_id) => {
        return this.query(
            "DELETE FROM constrained_questions WHERE id = $1 RETURNING *",
            [question_id.split("-").join("")]
        );
    }
}

const constrainedQuestionDB = new ConstrainedQuestionDB();

export default constrainedQuestionDB;