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
const sql = require("mssql");
const dbg = require("debug");
const h = require("../helpers/misc");
const odataV4Sql = require("odata-v4-sql");
const debug = dbg('todo:todosTable');
class TodosTable extends h.Helpers.SqlTableType {
    constructor(connectionPool) {
        const todoFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'note', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'createdAt', type: sql.DateTime }),
            new h.Helpers.SqlField({ name: 'contentUrl', type: sql.NVarChar(512) }),
            new h.Helpers.SqlField({ name: 'title', type: sql.NVarChar(255) }),
            new h.Helpers.SqlField({ name: 'todoType', type: sql.NVarChar(50) }),
            new h.Helpers.SqlField({ name: 'priority', type: sql.Int }),
            new h.Helpers.SqlField({ name: 'categoryId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'completedAt', type: sql.DateTime }),
            new h.Helpers.SqlField({ name: 'completedById', type: sql.NVarChar(255) }),
            new h.Helpers.SqlField({ name: 'completedByName', type: sql.NVarChar(255) }),
            new h.Helpers.SqlField({ name: 'isCompleted', type: sql.Bit }),
            new h.Helpers.SqlField({ name: 'assignedToId', type: sql.NVarChar(255) }),
            new h.Helpers.SqlField({ name: 'assignedToName', type: sql.NVarChar(255) }),
            new h.Helpers.SqlField({ name: 'assignedToObjectType', type: sql.NVarChar(50) }),
            new h.Helpers.SqlField({ name: 'dueAt', type: sql.DateTime }),
            new h.Helpers.SqlField({ name: 'activityId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        super({ connectionPool: connectionPool, tableName: 'TodosBase', viewName: 'Todos', fields: todoFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: false });
        debug.enabled = true;
        const todoTagFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'todoId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'tagId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        this.todosTagsTable = new h.Helpers.SqlTableType({ connectionPool: connectionPool, tableName: 'TodosTagsBase', viewName: 'TodosTags', fields: todoTagFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
    }
    getAll(q) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!q || q == '/' || q == '/?') {
                q = '$top=100';
            }
            const query = odataV4Sql.createQuery(q);
            if (!query.limit) {
                query.limit = 1000;
            }
            if (query.limit > 1000) {
                throw new Error(`Parse error: max number of rows returned can be 1000. please adjust query to 'top=1000'`);
            }
            let result = null;
            try {
                const requ = new sql.Request(this.connectionPool);
                let sqlQuery = `select ${query.select} from ${this.viewName}`;
                let where = query.where;
                if (where) {
                    for (let p of query.parameters) {
                        if (where.indexOf('?') < 0) {
                            throw new Error(`Parse error: could not parse near '${p[1]}'`);
                        }
                        requ.input(`${p[0]}`, `${p[1]}`);
                        where = where.replace('?', `@${p[0]}`);
                    }
                    sqlQuery += ` WHERE ${where}`;
                }
                //TODO: Proper order by here
                sqlQuery += ` 
      ORDER BY CURRENT_TIMESTAMP`;
                sqlQuery += ` 
      OFFSET ${query.skip || 0} ROWS`;
                sqlQuery += ` 
      FETCH NEXT ${query.limit} ROWS ONLY`;
                result = yield requ.query(sqlQuery);
                result = result.recordset;
                debug(result);
                for (let i = 0; i < result.length; i++) {
                    result[i].tags = yield this.getTags(result[i].id);
                }
                return result;
            }
            catch (er) {
                debug(er);
                throw er;
            }
        });
    }
    getTags(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let tagsArr = new Array();
            let tags = yield this.todosTagsTable.getAll(`$filter=todoId eq ${id}`);
            tags.forEach((t) => {
                tagsArr.push({ 'id': t.tagId, 'title': t.tagTitle });
            });
            return tagsArr;
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const requ = new sql.Request(this.connectionPool);
            debug('select by id: ', `select * from ${this.viewName} where id= @id`);
            requ.input('id', id);
            let result = yield requ.query(`select * from ${this.viewName} where id= @id`);
            debug('return of check for the same id', result);
            let item = null;
            if (!!result.recordset && result.recordset.length === 1) {
                item = result.recordset[0];
                item.tags = yield this.getTags(item.id);
            }
            return item;
        });
    }
    customUpdateChecks(jsonBody) {
        if ((jsonBody.completedAt || jsonBody.completedById || jsonBody.completedByName) && (!jsonBody.completedAt || !jsonBody.completedById || !jsonBody.completedByName)) { //all or none
            throw new Error(`Body is missing the fields för closing todo. all the fields 'completedAt' and 'completedById' and 'completedByName' must be present.`);
        }
        if ((jsonBody.assignedToId || jsonBody.assignedToName || jsonBody.assignedToObjectType) && (!jsonBody.assignedToId || !jsonBody.assignedToName || !jsonBody.assignedToObjectType)) { //all or none
            throw new Error(`Body is missing the fields för assigning todo. all the fields 'assignedToId' and 'assignedToName' and 'assignedToObjectType' must be present.`);
        }
        return;
    }
    customInsertChecks(jsonBody) {
        this.customUpdateChecks(jsonBody);
    }
}
exports.TodosTable = TodosTable;
//# sourceMappingURL=todosTable.js.map