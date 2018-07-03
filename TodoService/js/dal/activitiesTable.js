"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const dbg = require("debug");
const h = require("../helpers/misc");
const todosTable_1 = require("./todosTable");
const activtiesTagsT = require("./activitiesTagsTable");
const sqlTableType_1 = require("./sqlTableType");
const activityCardsTable_1 = require("./activityCardsTable");
const debug = dbg('todo:activitiesTable');
class ActivitiesTable extends sqlTableType_1.SqlTableType {
    constructor(connectionPool) {
        const activityFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({
                name: 'description',
                type: sql.NVarChar(sql.MAX),
            }),
            new h.Helpers.SqlField({
                name: 'createdAt',
                type: sql.DateTime,
            }),
            new h.Helpers.SqlField({
                name: 'context',
                type: sql.NVarChar(512),
            }),
            new h.Helpers.SqlField({
                name: 'title',
                type: sql.NVarChar(255),
            }),
            new h.Helpers.SqlField({
                name: 'activityType',
                type: sql.NVarChar(50),
            }),
            new h.Helpers.SqlField({
                name: 'priority',
                type: sql.Int,
            }),
            new h.Helpers.SqlField({
                name: 'categoryOneId',
                type: sql.BigInt,
            }),
            new h.Helpers.SqlField({
                name: 'categoryTwoId',
                type: sql.BigInt,
            }),
            new h.Helpers.SqlField({
                name: 'system',
                type: sql.BigInt,
            }),
            new h.Helpers.SqlField({
                name: 'descriptionimage',
                type: sql.VarBinary(sql.MAX),
            }),
            new h.Helpers.SqlField({
                name: 'modifiedOn',
                type: sql.DateTime,
            }),
            new h.Helpers.SqlField({
                name: 'createdById',
                type: sql.NVarChar(255),
            }),
            new h.Helpers.SqlField({
                name: 'createdByName',
                type: sql.NVarChar(255),
            }),
            new h.Helpers.SqlField({
                name: 'context',
                type: sql.NVarChar(255),
            })
        ];
        super({
            // tslint:disable-next-line:object-literal-shorthand
            connectionPool: connectionPool,
            tableName: 'ActivitiesBase',
            viewName: 'Activities',
            fields: activityFields,
            autoGeneratedPrimaryKey: true,
            throwOnExtraFields: false,
        });
        debug.enabled = true;
        this.activitiesTagsTable = new activtiesTagsT.ActivitiesTagsTable(connectionPool);
        this.todosTable = new todosTable_1.TodosTable(connectionPool);
        this.activityCardsTable = new activityCardsTable_1.ActivityCardsTable(connectionPool);
    }
    async instantiateTodo(jsonBody, activity) {
        jsonBody = ActivitiesTable.preParseJson(jsonBody);
        if (!jsonBody.assignedToId) {
            throw new Error(`Body is missing the field 'assignedToId'`);
        }
        if (!jsonBody.assignedToName) {
            throw new Error(`Body is missing the field 'assignedToName'`);
        }
        if (!jsonBody.assignedToObjectType) {
            throw new Error(`Body is missing the field 'assignedToObjectType'`);
        }
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
            if (activity.tags && activity.tags.length > 0) {
                let activityTags = activity.tags;
                // await this.getTags(activity.activityId);
                // await activityTags.forEach(async function (at) {
                for (let i = 0; i < activityTags.length; i++) {
                    let at = activityTags[i];
                    delete at.title;
                    at.tagId = at.id;
                    delete at.id;
                    at.todoId = todo.id;
                    const todostag = await this.todosTable.todosTagsTable.insertTransPool(at, false, transaction);
                    debug(todostag);
                } // .bind(this));
            }
            let activityCardsFilter = `$filter=activityId eq ${activity.activityId}`;
            let activityCards = await this.activityCardsTable.getAll(activityCardsFilter);
            for (let i = 0; i < activityCards.length; i++) {
                //throw new Error('momo tests deleting the extra todo');
                let tc = activityCards[i];
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
    async customUpdateChecks(jsonBody) {
        jsonBody = ActivitiesTable.preParseJson(jsonBody);
    }
    async customInsertChecks(jsonBody) {
        jsonBody = ActivitiesTable.preParseJson(jsonBody);
        jsonBody.createdAt = new Date();
    }
    // tslint:disable-next-line:member-ordering
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
exports.ActivitiesTable = ActivitiesTable;
//# sourceMappingURL=activitiesTable.js.map