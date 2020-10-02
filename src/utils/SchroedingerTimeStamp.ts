export default class SchroedingerTimeStamp{
    static currentUTCMsTimeStamp() : number{
        let date = new Date(new Date().getTime());
        date.getTimezoneOffset();
        return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds(),
        ).getTime();
    }

    static currentUTCDate(){
        let date = new Date(new Date().getTime());
        date.getTimezoneOffset();
        return new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds(),
        );
    }

    static msTimeStampToDate(timestamp: number){
        return new Date(timestamp);
    }
}