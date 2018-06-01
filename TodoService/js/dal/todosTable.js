"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const dbg = require("debug");
const h = require("../helpers/misc");
const sqlTableType_1 = require("./sqlTableType");
const debug = dbg('todo:todosTable');
class TodosTable extends sqlTableType_1.SqlTableType {
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
        super({ connectionPool: connectionPool, tableName: 'TodosBase', viewName: 'TodosSimple', fields: todoFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: false });
        debug.enabled = true;
        const todoTagFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'todoId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'tagId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        this.todosTagsTable = new sqlTableType_1.SqlTableType({ connectionPool: connectionPool, tableName: 'TodosTagsBase', viewName: 'TodosTags', fields: todoTagFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
    }
    //   async getAll(q: string) {
    //     if(!q || q == '/' || q =='/?'){
    //       q='$top=100'
    //     }
    //     const query = odataV4Sql.createQuery(q);
    //     if(!query.limit){
    //       query.limit=1000;
    //     }
    //     if(query.limit>1000){
    //       throw new Error(`Parse error: max number of rows returned can be 1000. please adjust query to 'top=1000'`);
    //     }
    //     let result = null;
    //     try {
    //       const requ = new sql.Request(this.connectionPool);
    //       let sqlQuery = //`select ${query.select} from ${this.viewName}`;
    // `
    // SELECT  baseTable.id, baseTable.note, baseTable.createdAt, baseTable.contentUrl, baseTable.modifiedOn, baseTable.title, baseTable.todoType, baseTable.[priority], 
    //         baseTable.completedAt, baseTable.completedById as [completedBy.id], baseTable.completedByName as [completedBy.name], 
    // --        CASE WHEN baseTable.completedAt IS NULL THEN 'false' ELSE 'true' END as isCompleted, 				   
    //         baseTable.assignedToId as [assignedTo.id], baseTable.assignedToName as [assignedTo.name], baseTable.assignedToObjectType as [assignedTo.objectType],  
    //         baseTable.dueAt, baseTable.activityId, baseTable.categoryId as [category.id], c.title as [category.title],
    //         ISNULL((SELECT tt.tagid AS [id], tt.tagtitle AS [title]
    //                                 from TodosTags as tt
    //                                 where baseTable.id = tt.todoId
    //                                 FOR JSON PATH), '[]') as tags
    // FROM     dbo.Categories c INNER JOIN
    //                   dbo.TodosBase baseTable ON c.id = baseTable.categoryId
    // `
    //       let where = query.where;
    //       if (where) {
    //         for (let p of query.parameters) {
    //           if (where.indexOf('?') < 0) {
    //             throw new Error(`Parse error: could not parse near '${p[1]}'`);
    //           }
    //           requ.input(`${p[0]}`, `${p[1]}`);
    //           where = where.replace('?', `@${p[0]}`);
    //           where = where.replace('[', 'baseTable.[');
    //         }
    //         sqlQuery += `
    // WHERE ${where}`;
    //       }
    //       //TODO: Proper order by here
    //       sqlQuery += ` 
    // ORDER BY CURRENT_TIMESTAMP
    // OFFSET ${query.skip || 0} ROWS
    // FETCH NEXT ${query.limit} ROWS ONLY
    // FOR JSON PATH`;
    //       result = await requ.query(sqlQuery);
    //       result = result.recordset[0]["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"];// the special name of the json column
    //       debug(result);
    //       return result;
    //     } catch (er) {
    //       debug(er);
    //       throw er;
    //     }
    //   }
    // async getById(id: any) {
    //   let result = await this.getAll(`$filter=id eq ${id}`);
    //   debug('return of check for the same id', result);
    //   result = result != "" ? JSON.parse(result)[0] : null;
    //   return result;
    // }
    async customUpdateChecks(jsonBody) {
        jsonBody = TodosTable.preParseJson(jsonBody);
        if ((jsonBody.completedAt || jsonBody.completedById || jsonBody.completedByName) && (!jsonBody.completedAt || !jsonBody.completedById || !jsonBody.completedByName)) { //all or none
            throw new Error(`Body is missing the fields för closing todo. all the fields 'completedAt' and 'completedById' and 'completedByName' must be present.`);
        }
        if ((jsonBody.assignedToId || jsonBody.assignedToName || jsonBody.assignedToObjectType) && (!jsonBody.assignedToId || !jsonBody.assignedToName || !jsonBody.assignedToObjectType)) { //all or none
            throw new Error(`Body is missing the fields för assigning todo. all the fields 'assignedToId' and 'assignedToName' and 'assignedToObjectType' must be present.`);
        }
        return;
    }
    async customInsertChecks(jsonBody) {
        await this.customUpdateChecks(jsonBody);
        jsonBody.createdAt = new Date();
    }
    static preParseJson(jsonBody) {
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
exports.TodosTable = TodosTable;
//# sourceMappingURL=todosTable.js.map