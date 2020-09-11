class Cachable {
    initialize(req, res, next){
        req.cache = {
            read: {},
            write: {},
            request: {}
        };
        res.cache = {
            read: {},
            write: {},
            response: {}
        };
        return next();
    }

    finalize(req, res, next){
        if (res.cache.response.status && !res.cache.response.body) {
            return res.sendStatus(res.cache.response.status);
        }
        if (res.cache.response.status && res.cache.response.body) {
            return res.status(res.cache.response.status).send(res.cache.response.body);
        }
        return next();
    }
}

const cacheable = new Cachable();
export default cacheable;