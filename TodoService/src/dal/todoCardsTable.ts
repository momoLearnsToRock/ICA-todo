import sql = require('mssql');
import dbg = require('debug');
import h = require('../helpers/misc');
import odataV4Sql = require('odata-v4-sql');
import { SqlTableType } from './sqlTableType';

const debug = dbg('todo:todoCardsTable');

export class TodoCardsTable extends SqlTableType {
  constructor(connectionPool: sql.ConnectionPool) {
    const todoCardsFields: h.Helpers.SqlField[] = [
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

  async getOutputMedia(id: any) {
    const requ = new sql.Request(this.connectionPool);
    debug("select outputMedia: ", `select outputFileName, outputFileContentType, outputFileData from ${this.tableName} where id= @id`);
    requ.input("id", id);
    let result = await requ.query(
      `select outputFileName, outputFileContentType, outputFileData from ${this.tableName} where id= @id`
    );
    debug("return of check for the same id", result);
    let item = null;
    if (!!result.recordset && result.recordset.length === 1) {
      item = result.recordset[0];
    }
    return item;
  }

  async setOutputMedia(id: any, fileName: any, contentType: any, fileData: any){
    const requ = new sql.Request(this.connectionPool);
    requ.input("id", sql.BigInt, id)
    requ.input("fileName", sql.NVarChar(sql.MAX), fileName)
    requ.input("contentType", sql.NVarChar(50), contentType)
    requ.input("fileData", sql.NVarChar(sql.MAX), fileData)
    var query = `UPDATE ${this.tableName} 
      SET outputFileName = @fileName, outputFileContentType = @contentType, outputFileData = CONVERT(VARBINARY(MAX), @fileData, 1) WHERE id = @id`;
    let result = await requ.query(query);
    debug("Insert output media", result);
  };

  async customUpdateChecks(jsonBody: any) {
    return;
  }
  async customInsertChecks(jsonBody: any) {
    return;
  }
}