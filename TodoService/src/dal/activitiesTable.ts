import sql = require('mssql');
import dbg = require('debug');
import h = require('../helpers/misc');
import odataV4Sql = require('odata-v4-sql');
import { TodosTable } from './todosTable';
import activtiesTagsT = require('./activitiesTagsTable');
import { SqlTableType } from './sqlTableType';
import { ActivityCardsTable } from './activityCardsTable';

const debug = dbg('todo:activitiesTable');

export class ActivitiesTable extends SqlTableType {
  public activitiesTagsTable: SqlTableType;
  public todosTable: TodosTable;
  public activityCardsTable: ActivityCardsTable;
  constructor(connectionPool: sql.ConnectionPool) {
    const activityFields: h.Helpers.SqlField[] = [new h.Helpers.SqlField(
      { name: 'id', type: sql.BigInt },
    ), new h.Helpers.SqlField({
      name: 'note',
      type: sql.NVarChar(sql.MAX),
    }), new h.Helpers.SqlField({
      name: 'createdAt',
      type: sql.DateTime,
    }), new h.Helpers.SqlField({
      name: 'contentUrl',
      type: sql.NVarChar(512),
    }), new h.Helpers.SqlField({
      name: 'title',
      type: sql.NVarChar(255),
    }), new h.Helpers.SqlField({
      name: 'activityType',
      type: sql.NVarChar(50),
    }), new h.Helpers.SqlField({
      name: 'priority',
      type: sql.Int,
    }), new h.Helpers.SqlField({
      name: 'categoryId',
      type: sql.BigInt,
    }), new h.Helpers.SqlField({ // new h.Helpers.SqlField({name: 'categoryTitle', type: sql.NVarChar(100)}),
      name: 'modifiedOn',
      type: sql.DateTime,
    })];

    super({
      connectionPool: connectionPool,
      tableName: 'ActivitiesBase',
      viewName: 'Activities',
      fields: activityFields,
      autoGeneratedPrimaryKey: true,
      throwOnExtraFields: false,
    });
    debug.enabled = true;

    this.activitiesTagsTable = new activtiesTagsT.ActivitiesTagsTable(connectionPool);
    this.todosTable = new TodosTable(connectionPool);
    this.activityCardsTable = new ActivityCardsTable(connectionPool);
  }

  async instantiateTodo(jsonBody: any, activity: any) {
    jsonBody = ActivitiesTable.preParseJson(jsonBody);
    if (!jsonBody.assignedToId) throw new Error(`Body is missing the field 'assignedToId'`);
    if (!jsonBody.assignedToName) throw new Error(`Body is missing the field 'assignedToName'`);
    if (!jsonBody.assignedToObjectType) throw new Error(`Body is missing the field 'assignedToObjectType'`);

    activity.activityId = activity.id;
    delete activity.id;
    activity.todoType = activity.activityType;
    delete activity.activityType;
    activity.assignedToId = jsonBody.assignedToId;
    activity.assignedToName = jsonBody.assignedToName;
    activity.assignedToObjectType = jsonBody.assignedToObjectType;
    activity.dueAt = !jsonBody.dueAt ? null : jsonBody.dueAt;
    // activity.startsAt = !jsonBody.startsAt?null:jsonBody.startsAt;

    let todo = null;
    const transaction = new sql.Transaction(this.connectionPool);
    await transaction.begin();
    try {
      todo = await this.todosTable.insertTransPool(activity, false, transaction);

      let activityTags = JSON.parse(activity.tags); //await this.getTags(activity.activityId);
      // await activityTags.forEach(async function (at) {
      for (let i: number = 0; i < activityTags.length; i++) {
        let at: any = activityTags[i];
        delete at.title;
        at.tagId = at.id;
        delete at.id;
        at.todoId = todo.id;
        const todostag = await this.todosTable.todosTagsTable.insertTransPool(at, false, transaction);
        debug(todostag);
      } // .bind(this));
      let activityCardsFilter: string = `$filter=activityId eq ${activity.activityId}`;
      let activityCards = await this.activityCardsTable.getAll(activityCardsFilter);
      for (let i: number = 0; i < activityCards.length; i++) {
        //throw new Error('momo tests deleting the extra todo');
        let tc: any = activityCards[i];
        delete tc.id;
        delete tc.activityId;
        tc.todoId = todo.id;
        const todostag = await this.todosTable.todoCardsTable.insertTransPool(tc, false, transaction);
        debug(todostag);
      }
      await transaction.commit();
    }
    catch (ex) {
      await transaction.rollback();
      throw ex;
    }
    debug('commited');
    return await this.todosTable.getById(todo.id);
  }

  async customUpdateChecks(jsonBody: any) {
    jsonBody = ActivitiesTable.preParseJson(jsonBody);
  }
  async customInsertChecks(jsonBody: any) {
    jsonBody = ActivitiesTable.preParseJson(jsonBody);
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
}
