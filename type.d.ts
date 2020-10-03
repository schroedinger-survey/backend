/* eslint-disable */
declare namespace Express {
    export interface Request {
        user: any;
        schroedinger: any;
    }
    export interface Response {
        user: any;
        schroedinger: any;
    }
}

declare namespace Schroedinger{
    export interface User{
        id: string,
        username: string,
        hashed_password: string,
        email: string,
        created: Date,
        last_edited: Date
    }
}