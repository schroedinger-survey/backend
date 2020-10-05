import AbstractNotification from "./AbstractNotification";

export default class NewSubmissionNotification extends AbstractNotification {
    private readonly surveyTitle: string;

    constructor(surveyTitle: string) {
        super();
        this.surveyTitle = surveyTitle;
    }

    content(): string {
        return this.surveyTitle;
    }

    title(): string {
        return "Your survey received a new result";
    }

}