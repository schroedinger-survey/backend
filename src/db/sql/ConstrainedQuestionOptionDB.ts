import AbstractSqlDB from "./AbstractSqlDB";

class ConstrainedQuestionOptionDB extends AbstractSqlDB{
    createConstrainedQuestionOption = (answer, position, constrainedQuestionId) => {
        return this.query(
            "INSERT INTO constrained_questions_options(answer, position, constrained_question_id) VALUES ($1, $2, $3) RETURNING id",
            [answer, position, constrainedQuestionId.split("-").join("")]
        );
    }

    getOptionsOfQuestion = (constrained_question_id) =>{
        return this.query(
            "SELECT * FROM constrained_questions_options where constrained_question_id = $1",
            [constrained_question_id.split("-").join("")]
        );
    }
}

const constrainedQuestionOptionDB = new ConstrainedQuestionOptionDB();
export default constrainedQuestionOptionDB;