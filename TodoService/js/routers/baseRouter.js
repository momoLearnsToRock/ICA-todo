"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbg = require("debug");
const express = require("express");
class BaseRouter {
    constructor({ table, disableGetAll, disablePost, disablePut, disablePatch, disableDelete }) {
        const debug = dbg("todo:baseRouter");
        debug.enabled = true;
        this.table = table;
        this.disableGetAll = disableGetAll;
        this.disablePost = disablePost;
        this.disablePut = disablePut;
        this.disablePatch = disablePatch;
        this.disableDelete = disableDelete;
        this.router = express.Router();
        this.router
            .route("/")
            .get((req, res) => {
            this.get(req, res);
        })
            .post((req, res) => {
            this.post(req, res);
        })
            .put((req, res) => {
            this.methodNotAvailable(res, `"put"`, `try using "put" on the address "${this.table.tableName}/{id}"`);
        })
            .delete((req, res) => {
            this.methodNotAvailable(res, `"delete"`, `try using "delete" on the address "${this.table.tableName}/{id}"`);
        });
        this.router.use("/:id", (req, res, next) => {
            if (req.path == "/" && req.body.id && req.body.id !== req.params.id) {
                // req.path=="/" checking that "/entity/id" is the last route and it does not go to "/entity/id/subEntity/sid"
                res
                    .status(400)
                    .send("Wrong id was passed as part of the request body.");
            }
            else {
                (async function query() {
                    try {
                        let rslt = await this.table.getById(req.params.id);
                        if (!rslt) {
                            throw new Error(`Could not find an entry with the given id.`);
                        }
                        // Parse known json arrays for the result
                        if (rslt.tags) {
                            rslt.tags = JSON.parse(rslt.tags);
                        }
                        if (rslt.cards) {
                            rslt.cards = JSON.parse(rslt.cards);
                        }
                        req.itemById = rslt;
                        next();
                    }
                    catch (err) {
                        let code = 500;
                        switch (err.message) {
                            case "error":
                                code = 400;
                            case "Could not find an entry with the given id.":
                                code = 404;
                                break;
                        }
                        res.status(code).send(err.message);
                    }
                }.bind(this)());
            }
        });
        this.router
            .route("/:id")
            .get((req, res) => {
            if (!!this.disableGetAll) {
                this.methodNotAvailable(res, "Get", "");
                return;
            }
            res.send(req.itemById);
        })
            .post((req, res) => {
            this.methodNotAvailable(res, `"post"`, `try using "post" on the address "${this.table.tableName}" instead of "${this.table.tableName}/${req.params.id}"`);
        })
            .put((req, res) => {
            this.put(req, res);
        })
            .patch((req, res) => {
            this.patch(req, res);
        })
            .delete((req, res) => {
            this.delete(req, res);
        });
    }
    get(req, res) {
        (async function query() {
            try {
                if (!!this.disableGetAll) {
                    this.methodNotAvailable(res, "Get", "");
                    return;
                }
                let reqUrl = req.url;
                reqUrl = reqUrl.substring(reqUrl.indexOf("$"), reqUrl.length);
                reqUrl = decodeURI(reqUrl);
                let rslt = await this.table.getAll(reqUrl);
                // Parse known json arrays for each item in the result
                if (rslt && rslt.length > 0) {
                    for (let item of rslt) {
                        if (item.tags) {
                            item.tags = JSON.parse(item.tags);
                        }
                        if (item.cards) {
                            item.cards = JSON.parse(item.cards);
                        }
                    }
                    ;
                }
                res.send(rslt);
            }
            catch (err) {
                console.log(err);
                let code = 500;
                switch (true) {
                    case "error" == err.message:
                    case /^Parse error:/.test(err.message):
                        code = 400;
                        break;
                }
                res.status(code).send(err.message);
            }
        }.bind(this)());
    }
    post(req, res) {
        (async function query() {
            try {
                if (!!this.disablePost) {
                    this.methodNotAvailable(res, "Post", "");
                    return;
                }
                if (req.body.id) {
                    if (this.table.autoGeneratedPrimaryKey) {
                        throw new Error("id should not be passed, it will be generated by the system");
                    }
                    const getResult = await this.table.getById(req.body.id);
                    if (getResult != null) {
                        throw new Error("an existing item already exists");
                    }
                }
                let insResult = await this.table.insert(req.body, true); // the second parameter makes sure all the needed fields are passed
                res.status(201).send(insResult);
            }
            catch (err) {
                let code = 500;
                switch (true) {
                    case "an existing item already exists" == err.message:
                        code = 409;
                        break;
                    case "error" == err.message:
                    case "id should not be passed, it will be generated by the system" ==
                        err.message:
                    case /^Body is missing the field/.test(err.message):
                    case /^No fields could be parsed from body./.test(err.message):
                    case /^The field '.*' entity.$/.test(err.message):
                    case /^the field '.*' has an invalid value.$/.test(err.message):
                        code = 400;
                        break;
                }
                res.status(code).send(err.message);
            }
        }.bind(this)());
    }
    put(req, res) {
        (async function query() {
            let result = null;
            try {
                if (!!this.disablePut) {
                    this.methodNotAvailable(res, "Put", "");
                    return;
                }
                if (req.itemById == null) {
                    throw new Error("Could not find an entry with the given id.");
                }
                result = await this.table.update(req.body, req.params.id, true); // the last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
                res.send(result);
            }
            catch (err) {
                let code = 500;
                switch (true) {
                    case "Could not find an entry with the given id." == err.message:
                    case "error" == err.message:
                    case /^Body is missing the field/.test(err.message):
                    case /^No fields could be parsed from body./.test(err.message):
                    case /^The field '.*' entity.$/.test(err.message):
                    case /^the field '.*' has an invalid value.$/.test(err.message):
                        code = 400;
                        break;
                }
                res.status(code).send(err.message);
            }
        }.bind(this)());
    }
    patch(req, res) {
        if (!!this.disablePatch) {
            this.methodNotAvailable(res, "Patch", "");
            return;
        }
        (async function query() {
            let result = null;
            try {
                if (!!this.disablePut) {
                    this.methodNotAvailable(res, "Put", "");
                    return;
                }
                if (req.itemById == null) {
                    throw new Error("Could not find an entry with the given id.");
                }
                result = await this.table.update(req.body, req.params.id, false); // the last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
                res.send(result);
            }
            catch (err) {
                let code = 500;
                switch (true) {
                    case "Could not find an entry with the given id." == err.message:
                    case "error" == err.message:
                    case /^Body is missing the field/.test(err.message):
                    case /^No fields could be parsed from body./.test(err.message):
                    case /^The field '.*' entity.$/.test(err.message):
                    case /^the field '.*' has an invalid value.$/.test(err.message):
                        code = 400;
                        break;
                }
                res.status(code).send(err.message);
            }
        }.bind(this)());
    }
    delete(req, res) {
        (async function query() {
            try {
                if (!!this.disableDelete) {
                    this.methodNotAvailable(res, "Delete", "");
                    return;
                }
                if (req.itemById == null) {
                    throw new Error("Could not find an entry with the given id.");
                }
                await this.table.delete(req.params.id);
                res.status(204).send();
            }
            catch (err) {
                let code = 500;
                switch (err.message) {
                    case "Could not find an entry with the given id.":
                    case "error":
                        code = 400;
                        break;
                }
                res.status(code).send(err.message);
            }
        }.bind(this)());
    }
    methodNotAvailable(res, verb, suggestion) {
        const message = `The ${verb} verb is not available. ${suggestion || ""}`;
        res.status(405).send(message);
    }
}
exports.BaseRouter = BaseRouter;
//# sourceMappingURL=baseRouter.js.map