"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const dbg = require("debug");
const h = require("./helpers/misc");
const sql = require("mssql");
const config = require("../config/sql.js");
const bodyParser = require("body-parser");
const baseRouter = require("./routers/baseRouter");
const acsTable = require("./dal/activitiesTable");
const acRouter = require("./routers/activitiesRouter");
const tdsTable = require("./dal/todosTable");
const sqlTableType_1 = require("./dal/sqlTableType");
const debug = dbg('todo:api');
class main {
    run() {
        debug.enabled = true;
        process.on('unhandledRejection', (err) => {
            debug('unhandledRejection ', err);
        });
        const app = express();
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.get(['/get', '/'], (req, res) => {
            res.send('Todo service apis 2.');
        });
        const pool = new sql.ConnectionPool(config, (err) => {
            if (err) {
                debug("error in getting the connection pool");
                throw (err);
            }
            const categoryFields = [
                new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
                new h.Helpers.SqlField({ name: 'title', type: sql.NVarChar(100) }),
                new h.Helpers.SqlField({ name: 'sortId', type: sql.Int }),
                new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
            ];
            const categoriesTable = new sqlTableType_1.SqlTableType({ connectionPool: pool, tableName: 'categories', viewName: 'categories', fields: categoryFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
            const cr = new baseRouter.BaseRouter({ table: categoriesTable, disableGetAll: false, disablePost: false, disablePut: false, disablePatch: true, disableDelete: false });
            app.use('/categories', cr.router);
            const tagFields = [
                new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
                new h.Helpers.SqlField({ name: 'title', type: sql.NVarChar(100) }),
                new h.Helpers.SqlField({ name: 'sortId', type: sql.Int }),
                new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
            ];
            const tagsTable = new sqlTableType_1.SqlTableType({ connectionPool: pool, tableName: 'tags', viewName: 'tags', fields: tagFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
            const tagsRouter = new baseRouter.BaseRouter({ table: tagsTable, disableGetAll: false, disablePost: false, disablePut: false, disablePatch: true, disableDelete: false });
            app.use('/tags', tagsRouter.router);
            const activitiesTable = new acsTable.ActivitiesTable(pool);
            const activitiesRouter = new acRouter.ActivitiesRouter({ table: activitiesTable, disableGetAll: false, disablePost: false, disablePut: false, disablePatch: true, disableDelete: false });
            app.use('/activities', activitiesRouter.router);
            const todosTable = new tdsTable.TodosTable(pool);
            const todosRouter = new baseRouter.BaseRouter({ table: todosTable, disableGetAll: false, disablePost: true, disablePut: false, disablePatch: false, disableDelete: true });
            app.use('/todos', todosRouter.router);
        });
        const port = process.env.PORT || 3000;
        app.listen(port, function () {
            debug(`listening on port ${port}`);
        });
    }
}
let m = new main();
m.run();
//# sourceMappingURL=app.js.map