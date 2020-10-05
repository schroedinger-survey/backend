import AbstractSqlDB from "./AbstractSqlDB";

class ConstrainedQuestionOptionDB extends AbstractSqlDB{
    createConstrainedQuestionOption = (answer: string, position: number, constrainedQuestionId: string) => {
        return this.query(
            "INSERT INTO constrained_questions_options(answer, position, constrained_question_id) VALUES ($1, $2, $3) RETURNING id",
            [answer, position, constrainedQuestionId.split("-").join("")]
        );
    }
}

const constrainedQuestionOptionDB = new ConstrainedQuestionOptionDB();
export default constrainedQuestionOptionDB;