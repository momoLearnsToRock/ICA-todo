import sql = require('mssql');
import dbg = require('debug');
import h = require('../helpers/misc');
import odataV4Sql= require('odata-v4-sql');
import {SqlTableType} from './sqlTableType';
import { TodoCardsTable } from './todoCardsTable';

const debug = dbg('todo:todosTable');

export class TodosTable extends SqlTableType {
  public todosTagsTable: SqlTableType;
  public todoCardsTable: TodoCardsTable;
  constructor(connectionPool: sql.ConnectionPool) {
    const todoFields: h.Helpers.SqlField[] = [
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
      new h.Helpers.SqlField({ name: 'createdById', type: sql.NVarChar(255) }),
      new h.Helpers.SqlField({ name: 'createdByName', type: sql.NVarChar(255) })
    ];

    super({ connectionPool: connectionPool, tableName: 'TodosBase', viewName: 'TodosSimple', fields: todoFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: false });
    debug.enabled = true;

    const todoTagFields: h.Helpers.SqlField[] = [
      new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
      new h.Helpers.SqlField({ name: 'todoId', type: sql.BigInt }),
      new h.Helpers.SqlField({ name: 'tagId', type: sql.BigInt }),
      new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
    ];

    this.todosTagsTable = new SqlTableType({ connectionPool: connectionPool, tableName: 'TodosTagsBase', viewName: 'TodosTags', fields: todoTagFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
    this.todoCardsTable = new TodoCardsTable(connectionPool);
  }

  async customUpdateChecks(jsonBody: any) {
    jsonBody = TodosTable.preParseJson(jsonBody);
    if ((jsonBody.completedAt || jsonBody.completedById || jsonBody.completedByName) && (!jsonBody.completedAt || !jsonBody.completedById || !jsonBody.completedByName)) { //all or none
      throw new Error(`Body is missing the fields för closing todo. all the fields 'completedAt' and 'completedById' and 'completedByName' must be present.`);
    }
    if ((jsonBody.assignedToId || jsonBody.assignedToName || jsonBody.assignedToObjectType) && (!jsonBody.assignedToId || !jsonBody.assignedToName || !jsonBody.assignedToObjectType)) { //all or none
      throw new Error(`Body is missing the fields för assigning todo. all the fields 'assignedToId' and 'assignedToName' and 'assignedToObjectType' must be present.`);
    }
    return;
  }
  async customInsertChecks(jsonBody: any) {
    await this.customUpdateChecks(jsonBody);
    jsonBody.createdAt = new Date();
  }
  static preParseJson(jsonBody: any): any {
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

  async updateTodoAndCards(jsonBody: JSON, id: any, throwOnMissingFields: boolean, previousTodoState: any){
    const transaction = new sql.Transaction(this.connectionPool);
    try {
      await transaction.begin();

      if ((<any>jsonBody).cards && (<any>jsonBody).cards.length > 0) {
        let todoCards = (<any>jsonBody).cards; 
        for (let i: number = 0; i < todoCards.length; i++) {
          let tc: any = todoCards[i];
          const tcUpdateResult = await this.todoCardsTable.updateTransPool(tc, tc.id, false, transaction);
          debug(tcUpdateResult);
        } // .bind(this));
      }
      const result = await this.update(jsonBody, id, throwOnMissingFields);
      await transaction.commit();
      return result;
    }
    catch (ex) {
      await transaction.rollback();
      throw ex;
    }
  }
}