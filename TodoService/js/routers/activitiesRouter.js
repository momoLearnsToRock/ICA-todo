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
const baseRouter = require("./baseRouter");
class ActivitiesRouter extends baseRouter.BaseRouter {
    constructor(table, disableGetAll) {
        super(table, disableGetAll);
        this.router.route('/:id/instantiateTodo')
            .get((req, res) => {
            res.send('try using the post verb');
        })
            .post((req, res) => {
            (function query() {
                return __awaiter(this, void 0, void 0, function* () {
                    let result = null;
                    try {
                        if (req.itemById == null) {
                            throw new Error('no data available');
                        }
                        result = yield this.table.instantiateTodo(req.body, req.itemById);
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
        });
    }
}
exports.ActivitiesRouter = ActivitiesRouter;
//# sourceMappingURL=activitiesRouter.js.map