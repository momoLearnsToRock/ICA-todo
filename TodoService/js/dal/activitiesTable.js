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
const activtiesTagsT = require("./activitiesTagsTable");
const sqlTableType_1 = require("./sqlTableType");
const debug = dbg('todo:activitiesTable');
class ActivitiesTable extends sqlTableType_1.SqlTableType {
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
        this.activitiesTagsTable = new activtiesTagsT.ActivitiesTagsTable(connectionPool);
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
                let sqlQuery = //`select ${query.select} from ${this.viewName}`;
                 `
SELECT baseTable.id, baseTable.note, baseTable.createdAt, 
baseTable.contentUrl, baseTable.modifiedOn, baseTable.title, 
baseTable.activityType, baseTable.[priority], 
baseTable.categoryId AS [category.id], dbo.Categories.title AS [category.title], 
ISNULL((SELECT at.tagid AS [id], at.tagtitle AS [title]
      FROM ActivitiesTags AS at
      WHERE baseTable.id = at.activityId
      FOR JSON PATH), '[]') as tags
FROM dbo.ActivitiesBase AS baseTable
INNER JOIN dbo.Categories ON baseTable.categoryId = dbo.Categories.id

`;
                let where = query.where;
                if (where) {
                    for (let p of query.parameters) {
                        if (where.indexOf('?') < 0) {
                            throw new Error(`Parse error: could not parse near '${p[1]}'`);
                        }
                        requ.input(`${p[0]}`, `${p[1]}`);
                        where = where.replace('?', `@${p[0]}`);
                        where = where.replace('[', 'baseTable.[');
                    }
                    sqlQuery += `
WHERE ${where}`;
                }
                //TODO: Proper order by here
                sqlQuery += ` 
ORDER BY CURRENT_TIMESTAMP
OFFSET ${query.skip || 0} ROWS
FETCH NEXT ${query.limit} ROWS ONLY
FOR JSON PATH`;
                result = yield requ.query(sqlQuery);
                result = result.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"]; // the special name of the json column
                debug(result);
                return result;
            }
            catch (er) {
                debug(er);
                throw er;
            }
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.getAll(`$filter=id eq ${id}`);
            debug('return of check for the same id', result);
            result = result != "" ? JSON.parse(result)[0] : null;
            return result;
        });
    }
    instantiateTodo(jsonBody, activity) {
        return __awaiter(this, void 0, void 0, function* () {
            jsonBody = this.preParseJson(jsonBody);
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
            let activityTags = activity.tags; //JSON.parse(activity.tags);//await this.getTags(activity.activityId);
            // await activityTags.forEach(async function (at) {
            for (let i = 0; i < activityTags.length; i++) {
                let at = activityTags[i];
                delete at.title;
                at.tagId = at.id;
                delete at.id;
                at.todoId = todo.id;
                const todostag = yield this.todosTable.todosTagsTable.insert(at, false);
                debug(todostag);
            } // .bind(this));
            todo = yield this.todosTable.getById(todo.id);
            return todo;
        });
    }
    customUpdateChecks(jsonBody) {
        return __awaiter(this, void 0, void 0, function* () {
            jsonBody = this.preParseJson(jsonBody);
        });
    }
    customInsertChecks(jsonBody) {
        return __awaiter(this, void 0, void 0, function* () {
            jsonBody = this.preParseJson(jsonBody);
            jsonBody.createdAt = new Date();
        });
    }
    preParseJson(jsonBody) {
        if (jsonBody.completedBy) {
            jsonBody.completedById = jsonBody.completedBy.id;
            jsonBody.completedByName = jsonBody.completedBy.name;
            delete jsonBody.completedBy;
        }
        if (jsonBody.assignedTo) {
            jsonBody.assignedToId = jsonBody.assignedTo.id;
            jsonBody.assignedToName = jsonBody.assignedTo.name;
            jsonBody.assignedToObjectType = jsonBody.assignedTo.objectType;
            delete jsonBody.assignedTo;
        }
        if (jsonBody.category) {
            jsonBody.categoryId = jsonBody.category.id;
            delete jsonBody.category;
        }
        return jsonBody;
    }
}
exports.ActivitiesTable = ActivitiesTable;
//# sourceMappingURL=activitiesTable.js.map