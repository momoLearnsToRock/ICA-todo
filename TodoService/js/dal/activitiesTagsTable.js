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
    customUpdateChecks(jsonBody) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!jsonBody.activityId || !jsonBody.tagId) { //all or none
                throw new Error(`Body is missing the fields. all the fields 'activityId' and 'tagId' must be present.`);
            }
            return;
        });
    }
    customInsertChecks(jsonBody, table) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.customUpdateChecks(jsonBody);
            const tagFields = [
                new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
                new h.Helpers.SqlField({ name: 'title', type: sql.NVarChar(100) }),
                new h.Helpers.SqlField({ name: 'sortId', type: sql.Int }),
                new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
            ];
            const tagsTable = new sqlTableType_1.SqlTableType({ connectionPool: this.connectionPool, tableName: 'tags', viewName: 'tags', fields: tagFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
            let tag = yield tagsTable.getById(jsonBody.tagId);
            if (!tag) { // checking that it is a valid tag
                throw new Error(`Could not find '${tagsTable.viewName}' with the id: '${jsonBody.tagId}'.`);
            }
            let reqUrl = `$filter=(activityId eq ${jsonBody.activityId} and tagId eq ${jsonBody.tagId})`;
            let rslt = yield this.getAll(reqUrl); // checking that there are no doubel inserts
            if (!!rslt && rslt.length != 0) {
                throw new Error(`An item with given identifier already exists.`);
            }
        });
    }
}
exports.ActivitiesTagsTable = ActivitiesTagsTable;
//# sourceMappingURL=activitiesTagsTable.js.map