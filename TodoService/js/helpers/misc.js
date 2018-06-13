"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dbg = require("debug");
const debug = dbg("todo:helpers");
var Helpers;
(function (Helpers) {
    class ResponseDTO {
        constructor({ message, data }) {
            this.message = message;
            this.data = data;
        }
    }
    Helpers.ResponseDTO = ResponseDTO;
    class SqlField {
        constructor({ name, type }) {
            this.name = name;
            this.type = type;
        }
    }
    Helpers.SqlField = SqlField;
    class TableType {
        constructor(tableName, viewName, throwOnExtraFields) {
            this.tableName = tableName;
            this.viewName = viewName;
            this.throwOnExtraFields = throwOnExtraFields;
        }
    }
    Helpers.TableType = TableType;
})(Helpers = exports.Helpers || (exports.Helpers = {}));
//# sourceMappingURL=misc.js.map