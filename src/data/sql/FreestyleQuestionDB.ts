import AbstractSqlDB from "./AbstractSqlDB";

class FreestyleQuestionDB extends AbstractSqlDB {
    createFreestyleQuestion = (question_text: string, position: number, survey_id: string) => {
        return this.query(
            "INSERT INTO freestyle_questions(question_text, position, survey_id) VALUES ($1, $2, $3::uuid) RETURNING id",
            [question_text, position, survey_id.split("-").join("")]
        );
    }

    deleteFreestyleQuestion = (question_id: string) => {
        return this.query(
            "DELETE FROM freestyle_questions WHERE id = $1 RETURNING *",
            [question_id.split("-").join("")]
        );
    }
}

const freestyleQuestionDB = new FreestyleQuestionDB();
export default freestyleQuestionDB;