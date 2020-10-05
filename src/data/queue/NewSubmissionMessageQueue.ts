import AbstractMessageQueue from "./AbstractMessageQueue";
import NewSubmissionNotification from "../../models/notifications/NewSubmissionNotification";

class NewSubmissionNotificationMessageQueue extends AbstractMessageQueue {
    publishNewSubmissionNotification = async (userId: string, notifications: Array<NewSubmissionNotification>): Promise<void> => {
        const payload = [];
        for(const notification of notifications){
            payload.push(JSON.stringify(notification.serialize()));
        }
        return await this.publish(`new_submission_${userId}`, payload);
    }

    consumeNewSubmissionNotification = async (userId: string, _consume: (message: string) => Promise<unknown>) : Promise<any>  => {
        return await this.consume(`new_submission_${userId}`, _consume);
    }
}

const newSubmissionNotificationMessageQueue = new NewSubmissionNotificationMessageQueue();
export default newSubmissionNotificationMessageQueue;