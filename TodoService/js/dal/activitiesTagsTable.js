"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const dbg = require("debug");
const h = require("../helpers/misc");
const sqlTableType_1 = require("./sqlTableType");
const debug = dbg('todo:todosTable');
class ActivitiesTagsTable extends sqlTableType_1.SqlTableType {
    constructor(connectionPool) {
        const activityTagsFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'activityId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'tagId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        super({ connectionPool: connectionPool, tableName: 'ActivitiesTagsBase', viewName: 'ActivitiesTags', fields: activityTagsFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: false });
        debug.enabled = true;
    }
    async customUpdateChecks(jsonBody) {
        if (!jsonBody.activityId) {
            throw new Error(`Body is missing the field 'activityId'`);
        }
        if (!jsonBody.tagId) {
            throw new Error(`Body is missing the field 'tagId'`);
        }
        return;
    }
    async customInsertChecks(jsonBody) {
        await this.customUpdateChecks(jsonBody);
        const tagFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'title', type: sql.NVarChar(100) }),
            new h.Helpers.SqlField({ name: 'sortId', type: sql.Int }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        const tagsTable = new sqlTableType_1.SqlTableType({ connectionPool: this.connectionPool, tableName: 'tags', viewName: 'tags', fields: tagFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
        let tag = await tagsTable.getById(jsonBody.tagId);
        if (!tag) { // checking that it is a valid tag
            throw new Error(`Could not find '${tagsTable.viewName}' with the id: '${jsonBody.tagId}'.`);
        }
        let reqUrl = `$filter=(activityId eq ${jsonBody.activityId} and tagId eq ${jsonBody.tagId})`;
        let rslt = await this.getAll(reqUrl); // checking that there are no doubel inserts
        if (!!rslt && rslt.length != 0) {
            throw new Error(`An item with given identifier already exists.`);
        }
    }
}
exports.ActivitiesTagsTable = ActivitiesTagsTable;
//# sourceMappingURL=activitiesTagsTable.js.map