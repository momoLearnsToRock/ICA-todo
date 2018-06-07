"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const dbg = require("debug");
const h = require("../helpers/misc");
const sqlTableType_1 = require("./sqlTableType");
const debug = dbg('todo:todoCardsTable');
class TodoCardsTable extends sqlTableType_1.SqlTableType {
    constructor(connectionPool) {
        const todoCardsFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'todoId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'notes', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'cardType', type: sql.NVarChar(50) }),
            new h.Helpers.SqlField({ name: 'input', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'outputText', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'outputMedia', type: sql.VarBinary(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        super({ connectionPool: connectionPool, tableName: 'TodoCardsBase', viewName: 'TodosCards', fields: todoCardsFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
        debug.enabled = true;
    }
    async getOutputMedia(id) {
        const requ = new sql.Request(this.connectionPool);
        debug("select outputMedia: ", `select outputFileName, outputFileContentType, outputFileData from ${this.tableName} where id= @id`);
        requ.input("id", id);
        let result = await requ.query(`select outputFileName, outputFileContentType, outputFileData from ${this.tableName} where id= @id`);
        debug("return of check for the same id", result);
        let item = null;
        if (!!result.recordset && result.recordset.length === 1) {
            item = result.recordset[0];
        }
        return item;
    }
    async setOutputMedia(id, fileName, contentType, fileData) {
        const requ = new sql.Request(this.connectionPool);
        requ.input("id", sql.BigInt, id);
        requ.input("fileName", sql.NVarChar(sql.MAX), fileName);
        requ.input("contentType", sql.NVarChar(50), contentType);
        requ.input("fileData", sql.NVarChar(sql.MAX), fileData);
        var query = `UPDATE ${this.tableName} 
      SET outputFileName = @fileName, outputFileContentType = @contentType, outputFileData = CONVERT(VARBINARY(MAX), @fileData, 1) WHERE id = @id`;
        let result = await requ.query(query);
        debug("Insert output media", result);
    }
    ;
    async customUpdateChecks(jsonBody) {
        return;
    }
    async customInsertChecks(jsonBody) {
        return;
    }
}
exports.TodoCardsTable = TodoCardsTable;
//# sourceMappingURL=todoCardsTable.js.map