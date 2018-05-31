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
const debug = dbg('todo:activityCardsTable');
class ActivityCardsTable extends sqlTableType_1.SqlTableType {
    constructor(connectionPool) {
        const activityCardsFields = [
            new h.Helpers.SqlField({ name: 'id', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'activityId', type: sql.BigInt }),
            new h.Helpers.SqlField({ name: 'notes', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'cardType', type: sql.NVarChar(50) }),
            new h.Helpers.SqlField({ name: 'input', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'outputText', type: sql.NVarChar(sql.MAX) }),
            new h.Helpers.SqlField({ name: 'modifiedOn', type: sql.DateTime }),
        ];
        super({ connectionPool: connectionPool, tableName: 'ActivityCardsBase', viewName: 'ActivityCardsBase', fields: activityCardsFields, autoGeneratedPrimaryKey: true, throwOnExtraFields: true });
        debug.enabled = true;
    }
    customUpdateChecks(jsonBody) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    customInsertChecks(jsonBody) {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
}
exports.ActivityCardsTable = ActivityCardsTable;
//# sourceMappingURL=activityCardsTable.js.map