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
const todosT = require("./todosTable");
const debug = dbg('todo:activitiesTable');
class ActivitiesTable extends h.Helpers.SqlTableType {
    constructor(connectionPool) {
        const activityFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'note', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'createdAt', type: sql.DateTime }),
            new h.Helpers.SqlField({ name: 'contentUrl', type: sql.NVarChar(512) }),
            new h.Helpers.SqlField({ name: 'title', type: sql.NVarChar(255) }),
            new h.Helpers.SqlField({ name: 'activityType', type: sql.NVarChar(50) }),
            new h.Helpers.SqlField({ name: 'priority', type: sql.Int }),
            new h.Helpers.SqlField({ name: 'categoryId', type: sql.BigInt }),
            // new h.Helpers.SqlField({name: 'categoryTitle', type: sql.NVarChar(100)}),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        super({ connectionPool: connectionPool, tableName: 'ActivitiesBase', viewName: 'Activities', fields: activityFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: false });
        debug.enabled = true;
        const activityTagFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'activityId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'tagId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        this.activitiesTagsTable = new h.Helpers.SqlTableType({
            connectionPool: connectionPool,
            tableName: 'ActivitiesTagsBase',
            viewName: 'ActivitiesTags',
            fields: activityTagFields,
            autoGeneratedPrimaryKey: true,
            throwOnExtraFields: true
        });
        this.todosTable = new todosT.TodosTable(connectionPool);
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
            let tags = yield this.activitiesTagsTable.getAll(`$filter=activityId eq ${id}`);
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
    instantiateTodo(jsonBody, activity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!jsonBody.assignedToId)
                throw new Error(`Body is missing the field 'assignedToId'`);
            if (!jsonBody.assignedToName)
                throw new Error(`Body is missing the field 'assignedToName'`);
            if (!jsonBody.assignedToObjectType)
                throw new Error(`Body is missing the field 'assignedToObjectType'`);
            activity.activityId = activity.id;
            delete activity.id;
            activity.todoType = activity.activityType;
            delete activity.activityType;
            activity.assignedToId = jsonBody.assignedToId;
            activity.assignedToName = jsonBody.assignedToName;
            activity.assignedToObjectType = jsonBody.assignedToObjectType;
            activity.dueAt = !jsonBody.dueAt ? null : jsonBody.dueAt;
            // activity.startsAt = !jsonBody.startsAt?null:jsonBody.startsAt;
            let todo = yield this.todosTable.insert(activity, false);
            let activityTags = yield this.getTags(activity.activityId);
            yield activityTags.forEach(function (at) {
                return __awaiter(this, void 0, void 0, function* () {
                    delete at.title;
                    at.tagId = at.id;
                    delete at.id;
                    at.todoId = todo.id;
                    const todostag = yield this.todosTable.todosTagsTable.insert(at, false);
                    debug(todostag);
                });
            });
            // for (let i = 0; i < activityTags.length; i++) {
            //   let at = activityTags[i];
            //   delete at.title;
            //   at.tagId = at.id;
            //   delete at.id;
            //   at.todoId = todo.id;
            //   const todostag = await this.todosTable.todosTagsTable.insert(at, false);
            //   debug(todostag);
            // }
            return todo;
        });
    }
}
exports.ActivitiesTable = ActivitiesTable;
//# sourceMappingURL=activitiesTable.js.map