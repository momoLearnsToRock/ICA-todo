"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dbg = require("debug");
const express = require("express");
class BaseRouter {
    constructor({ table, disableGetAll, disablePost, disablePut, disablePatch, disableDelete }) {
        const debug = dbg('todo:baseRouter');
        debug.enabled = true;
        this.table = table;
        this.disableGetAll = disableGetAll;
        this.disablePost = disablePost;
        this.disablePut = disablePut;
        this.disablePatch = disablePatch;
        this.disableDelete = disableDelete;
        this.router = express.Router();
        this.router.route('/')
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
        this.router.use('/:id', (req, res, next) => {
            if (req.body.id && req.body.id !== req.params.id) {
                res.status(400).send('Wrong id was passed as part of the request body.');
            }
            else {
                (function query() {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            let rslt = yield this.table.getById(req.params.id);
                            req.itemById = rslt;
                            next();
                        }
                        catch (err) {
                            let code = 500;
                            switch (err.message) {
                                case 'error':
                                    code = 400;
                                    break;
                            }
                            res.status(code).send(err.message);
                        }
                    });
                }.bind(this)());
            }
        });
        this.router.route('/:id')
            .get((req, res) => {
            if (!!this.disableGetAll) {
                this.methodNotAvailable(res, 'Get', '');
                return;
            }
            // if (req.itemById == null) {
            //   res.status(204).send({});
            // } else {
            res.send(req.itemById);
            // }      
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
        (function query() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!!this.disableGetAll) {
                        this.methodNotAvailable(res, 'Get', '');
                        return;
                    }
                    let reqUrl = req.url;
                    reqUrl = reqUrl.substring(reqUrl.indexOf('$'), reqUrl.length);
                    reqUrl = decodeURI(reqUrl);
                    let rslt = yield this.table.getAll(reqUrl);
                    res.send(rslt);
                }
                catch (err) {
                    console.log(err);
                    let code = 500;
                    switch (true) {
                        case 'error' == err.message:
                        case /^Parse error:/.test(err.message):
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            });
        }.bind(this)());
    }
    post(req, res) {
        (function query() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!!this.disablePost) {
                        this.methodNotAvailable(res, 'Post', '');
                        return;
                    }
                    if (req.body.id) {
                        if (this.table.autoGeneratedPrimaryKey) {
                            throw new Error('id should not be passed, it will be generated by the system');
                        }
                        const getResult = yield this.table.getById(req.body.id);
                        if (getResult != null) {
                            throw new Error('an existing item already exists');
                        }
                    }
                    let insResult = yield this.table.insert(req.body, true); // the second parameter makes sure all the needed fields are passed
                    res.status(201).send(insResult);
                }
                catch (err) {
                    let code = 500;
                    switch (true) {
                        case 'an existing item already exists' == err.message:
                            code = 409;
                            break;
                        case 'error' == err.message:
                        case 'id should not be passed, it will be generated by the system' == err.message:
                        case /^Body is missing the field/.test(err.message):
                        case /^No fields could be parsed from body./.test(err.message):
                        case /^The field '.*' entity.$/.test(err.message):
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            });
        }.bind(this)());
    }
    put(req, res) {
        (function query() {
            return __awaiter(this, void 0, void 0, function* () {
                let result = null;
                try {
                    if (!!this.disablePut) {
                        this.methodNotAvailable(res, 'Put', '');
                        return;
                    }
                    if (req.itemById == null) {
                        throw new Error('no data available');
                    }
                    result = yield this.table.update(req.body, req.params.id, true); // the last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
                    res.send(result);
                }
                catch (err) {
                    let code = 500;
                    switch (true) {
                        case 'no data available' == err.message:
                        case 'error' == err.message:
                        case /^Body is missing the field/.test(err.message):
                        case /^No fields could be parsed from body./.test(err.message):
                        case /^The field '.*' entity.$/.test(err.message):
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            });
        }.bind(this)());
    }
    patch(req, res) {
        if (!!this.disablePatch) {
            this.methodNotAvailable(res, 'Patch', '');
            return;
        }
        (function query() {
            return __awaiter(this, void 0, void 0, function* () {
                let result = null;
                try {
                    if (!!this.disablePut) {
                        this.methodNotAvailable(res, 'Put', '');
                        return;
                    }
                    if (req.itemById == null) {
                        throw new Error('no data available');
                    }
                    result = yield this.table.update(req.body, req.params.id, false); // the last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
                    res.send(result);
                }
                catch (err) {
                    let code = 500;
                    switch (true) {
                        case 'no data available' == err.message:
                        case 'error' == err.message:
                        case /^Body is missing the field/.test(err.message):
                        case /^No fields could be parsed from body./.test(err.message):
                        case /^The field '.*' entity.$/.test(err.message):
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            });
        }.bind(this)());
    }
    delete(req, res) {
        (function query() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!!this.disableDelete) {
                        this.methodNotAvailable(res, 'Delete', '');
                        return;
                    }
                    if (req.itemById == null) {
                        throw new Error('no data available');
                    }
                    yield this.table.delete(req.params.id);
                    res.status(204).send();
                }
                catch (err) {
                    let code = 500;
                    switch (err.message) {
                        case 'no data available':
                        case 'error':
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            });
        }.bind(this)());
    }
    methodNotAvailable(res, verb, suggestion) {
        const message = `The ${verb} verb is not available. ${suggestion || ''}`;
        res.status(405).send(message);
    }
}
exports.BaseRouter = BaseRouter;
//# sourceMappingURL=baseRouter.js.map