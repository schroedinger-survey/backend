import AbstractMessageQueue from "./AbstractMessageQueue";
import AbstractEmail from "../../models/mail/AbstractEmail";

class EmailMessageQueue extends AbstractMessageQueue {
    publishEmails = async (emails: Array<AbstractEmail>) : Promise<void>=> {
        const payload = [];
        for(const email of emails){
            payload.push(JSON.stringify(email.serialize()));
        }
        return await this.publish(process.env.SCHROEDINGER_MAIL_QUEUE, payload);
    }

    consumeEmails = async (_consume: (message: string) => Promise<unknown>) : Promise<any> => {
        return await this.consume(process.env.SCHROEDINGER_MAIL_QUEUE, _consume);
    }
}

const emailMessageQueue = new EmailMessageQueue();
export default emailMessageQueue;