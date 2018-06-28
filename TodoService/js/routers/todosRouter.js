"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseRouter = require("./baseRouter");
class TodosRouter extends baseRouter.BaseRouter {
    constructor({ table, disableGetAll, disablePost, disablePut, disablePatch, disableDelete }) {
        super({
            table: table,
            disableGetAll: disableGetAll,
            disablePost: disablePost,
            disablePut: disablePut,
            disablePatch: disablePatch,
            disableDelete: disableDelete
        });
        function isUploadedFile(file) {
            return typeof file === 'object' && file.name !== undefined;
        }
        // Convert attached file to HEX string to store in database
        function convertAttachmentToHex(fileData) {
            let hexStr = '0x';
            for (let i = 0; i < fileData.length; i++) {
                let hex = (fileData[i] & 0xff).toString(16);
                hex = (hex.length === 1) ? '0' + hex : hex;
                hexStr += hex;
            }
            return hexStr.toUpperCase();
        }
        // #region TodoCards
        // ROUTE: /todos/n/cards
        this.router.route("/:todoId/cards")
            // GET
            .get((req, res) => {
            (async function query() {
                try {
                    let reqUrl = `$filter=todoId eq ${req.params.todoId}`;
                    let rslt = await this.table.todoCardsTable.getAll(reqUrl);
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
        })
            // POST
            .post((req, res) => {
            (async function query() {
                try {
                    if (req.body.id) {
                        if (this.table.todoCardsTable.autoGeneratedPrimaryKey) {
                            throw new Error("id should not be passed, it will be generated by the system");
                        }
                    }
                    req.body.todoId = req.params.todoId;
                    let insResult = await this.table.todoCardsTable.insert(req.body, true); // the second parameter makes sure all the needed fields are passed
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
                        case /^Could not find '.*' with the id: '.*'./.test(err.message):
                        case /^An item with given identifier already exists.$/.test(err.message):
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            }.bind(this)());
        });
        // ROUTE: /todos/n/tags
        // ROUTE: /todos/n/cards/n
        // Middle-ware
        this.router.use("/:todoId/cards/:cardId", (req, res, next) => {
            (async function query() {
                try {
                    let reqUrl = `$filter=(todoId eq ${req.params.todoId} and id eq ${req.params.cardId})`;
                    let rslt = await this.table.todoCardsTable.getAll(reqUrl);
                    if (!rslt || rslt.length == 0) {
                        throw new Error(`Could not find an entry with the given id.`);
                    }
                    req.todoCardById = rslt[0];
                    if (req.body.id && req.body.id !== req.todoCardById.id) {
                        res
                            .status(400)
                            .send("Wrong id was passed as part of the request body.");
                    }
                    next();
                }
                catch (err) {
                    let code = 500;
                    switch (err.message) {
                        case "error":
                        case "Wrong id was passed as part of the request body.":
                            code = 400;
                        case "Could not find an entry with the given id.":
                            code = 404;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            }.bind(this)());
        });
        this.router.route("/:todoId/cards/:cardId")
            // GET
            .get((req, res) => {
            (async function query() {
                try {
                    let reqUrl = `$filter=todoId eq ${req.params.todoId} and id eq ${req.params.cardId}`;
                    let rslt = await this.table.todoCardsTable.getAll(reqUrl);
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
        })
            // POST (not allowed)
            .post((req, res) => {
            this.methodNotAvailable(res, `"post"`, `try using "post" on the address "todos/${req.params.todoId}/cards" instead of "todos/${req.params.todoId}/cards/${req.params.cardId}"`);
        })
            // PUT
            .put((req, res) => {
            (async function query() {
                let result = null;
                try {
                    if (req.todoCardById == null) {
                        throw new Error("Could not find an entry with the given id.");
                    }
                    result = await this.table.todoCardsTable.update(req.body, req.params.cardId, true); // the last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
                    res.send(result);
                }
                catch (err) {
                    let code = 500;
                    switch (true) {
                        case /^Could not find an entry with the given id./.test(err.message):
                        case "error" == err.message:
                        case /^Body is missing the field/.test(err.message):
                        case /^No fields could be parsed from body./.test(err.message):
                        case /^The field '.*' entity.$/.test(err.message):
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            }.bind(this)());
        })
            // PATCH
            .patch((req, res) => {
            (async function query() {
                let result = null;
                try {
                    if (req.todoCardById == null) {
                        throw new Error("Could not find an entry with the given id.");
                    }
                    result = await this.table.todoCardsTable.update(req.body, req.params.cardId, false);
                    res.send(result);
                }
                catch (err) {
                    let code = 500;
                    switch (true) {
                        case /^Could not find an entry with the given id./.test(err.message):
                        case "error" == err.message:
                        case /^Body is missing the field/.test(err.message):
                        case /^No fields could be parsed from body./.test(err.message):
                        case /^The field '.*' entity.$/.test(err.message):
                            code = 400;
                            break;
                    }
                    res.status(code).send(err.message);
                }
            }.bind(this)());
        })
            // DELETE
            .delete((req, res) => {
            (async function query() {
                try {
                    if (req.todoCardById == null) {
                        throw new Error("Could not find an entry with the given id.");
                    }
                    await this.table.todoCardsTable.delete(req.todoCardById.id);
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
        });
        // Route for outputMedia
        this.router.route("/:todoId/cards/:cardId/attachment/")
            .post((req, resp) => {
            (async function query() {
                try {
                    if (req.files && req.files.attachment && isUploadedFile(req.files.attachment)) {
                        // Get attachment from request
                        let fileName = req.files.attachment.name;
                        let fileContentType = req.files.attachment.mimetype;
                        let fileData = convertAttachmentToHex(req.files.attachment.data);
                        await this.table.todoCardsTable.setOutputMedia(req.params.cardId, fileName, fileContentType, fileData);
                        resp.status(200).send({ fileName: fileName, contentType: fileContentType });
                    }
                    else {
                        resp.status(422).send("Attachment is missing.");
                    }
                }
                catch (ex) {
                    resp.status(500).send("An error occured while processing attachment.");
                }
            }.bind(this)());
        });
        this.router.route("/:todoId/cards/:cardId/attachment/:fileName/")
            .get((req, res) => {
            (async function query() {
                try {
                    // Fetch file data and meta data
                    let rslt = await this.table.todoCardsTable.getOutputMedia(req.params.cardId);
                    // Check if file exists and that file name matches, else send 404
                    if (rslt && rslt.outputFileName && rslt.outputFileName.localeCompare(req.params.fileName) === 0) {
                        // Set headers with content-type
                        res.setHeader('Content-Type', rslt.outputFileContentType);
                        res.setHeader('Content-Disposition', 'filename=' + rslt.outputFileName);
                        res.status(200).send(rslt.outputFileData);
                    }
                    else {
                        // File not found or file name doesn't match
                        res.status(404).send("File not found.");
                    }
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
        });
        // #endregion TodoCards
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
                result = await this.table.updateTodoAndCards(req.body, req.params.id, true, req.itemById); // the second to last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
                res.send(result);
            }
            catch (err) {
                let code = 500;
                switch (true) {
                    case /^Could not find an entry with the given id./.test(err.message):
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
                result = await this.table.updateTodoAndCards(req.body, req.params.id, false, req.itemById); // the second to last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
                res.send(result);
            }
            catch (err) {
                let code = 500;
                switch (true) {
                    case /^Could not find an entry with the given id./.test(err.message):
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
}
exports.TodosRouter = TodosRouter;
//# sourceMappingURL=todosRouter.js.map