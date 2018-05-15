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
const odataV4Sql = require("odata-v4-sql");
const debug = dbg('todo:helpers');
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
        constructor(name) {
            this.tableName = name;
        }
    }
    Helpers.TableType = TableType;
    class SqlTableType extends TableType {
        constructor({ connectionPool, tableName, fields, autoGeneratedPrimaryKey }) {
            super(tableName);
            // this.tableName = tableName;
            this.fields = fields;
            this.autoGeneratedPrimaryKey = autoGeneratedPrimaryKey;
            this.connectionPool = connectionPool;
        }
        getFieldNames(includeId) {
            let fieldsString = '';
            this.fields.forEach((item, index) => {
                if (includeId || item.name.toLowerCase() !== 'id') {
                    fieldsString += item.name;
                    if (index !== this.fields.length - 1) {
                        fieldsString += ', ';
                    }
                }
            });
            return fieldsString;
        }
        parseFieldsInJsonBody({ includeId, jsonBody, throwOnMissingFields, throwOnMissingModifiedOn, throwOnExtraFields, sqlReq }) {
            const parsedFieldsList = [];
            this.fields.forEach((item, index) => {
                if (includeId || item.name.toLowerCase() !== 'id') {
                    if (item.name === 'modifiedOn') {
                        if (throwOnMissingModifiedOn && typeof jsonBody[item.name] == 'undefined') {
                            throw new Error(`Body is missing the field '${item.name}'.`);
                        }
                    }
                    else {
                        if (throwOnMissingFields && typeof jsonBody[item.name] == 'undefined') {
                            throw new Error(`Body is missing the field '${item.name}'.`);
                        }
                        sqlReq.input(item.name, item.type, jsonBody[item.name]);
                    }
                    parsedFieldsList.push(item.name);
                }
            });
            if (parsedFieldsList.length == 0) {
                throw new Error('No fields could be parsed from body.');
            }
            if (throwOnExtraFields) {
                let bodyKeys = Object.keys(jsonBody);
                bodyKeys.forEach((item, index) => {
                    if (this.fields.map((f) => { return f.name; }).indexOf(item) < 0) {
                        throw new Error(`The field '${item}' does not exist on the '${this.tableName}' entity.`);
                    }
                });
            }
            return parsedFieldsList;
        }
        createInsertIntoStatement(includeId, jsonBody, sqlReq) {
            const parsedFieldsList = this.parseFieldsInJsonBody({ includeId: includeId, jsonBody: jsonBody, throwOnMissingFields: true, throwOnExtraFields: true, throwOnMissingModifiedOn: false, sqlReq: sqlReq });
            const indexOfId = this.fields.map((f) => { return f.name; }).indexOf('id');
            const PKType = this.fields[indexOfId].type;
            const query = `DECLARE @_keys table([Id] ${PKType.declaration})
  
       INSERT INTO ${this.tableName} (${parsedFieldsList.map((f) => { return `[${f}]`; }).join(', ')}) 
       OUTPUT inserted.Id INTO @_keys
       VALUES (${parsedFieldsList.map((f) => { return f == 'modifiedOn' ? 'GETDATE()' : `@${f}`; }).join(', ')})
  
       SELECT t.*
       FROM @_keys AS g 
       JOIN dbo.${this.tableName} AS t 
       ON g.Id = t.Id`;
            // this method is a copy of what EF does
            return query;
        }
        createDeleteStatement(id, sqlReq) {
            sqlReq.input('id', id);
            return `DELETE FROM ${this.tableName} WHERE Id = @id`;
        }
        getAll(q) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!q || q == '/' || q == '/?') {
                    q = '$top=100';
                }
                const query = odataV4Sql.createQuery(q);
                if (!query.limit) {
                    query.limit = 1000;
                }
                if (query.limit > 1000) {
                    throw new Error(`Parse error: max number of rows returned can be 1000. please adjust query to 'top=1000'`);
                }
                let result = null;
                try {
                    const requ = new sql.Request(this.connectionPool);
                    let sqlQuery = `select ${query.select} from ${this.tableName}`;
                    let where = query.where;
                    if (where) {
                        for (let p of query.parameters) {
                            if (where.indexOf('?') < 0) {
                                throw new Error(`Parse error: could not parse near '${p[1]}'`);
                            }
                            requ.input(`${p[0]}`, `${p[1]}`);
                            where = where.replace('?', `@${p[0]}`);
                        }
                        sqlQuery += ` WHERE ${where}`;
                    }
                    //TODO: Proper order by here
                    sqlQuery += ` 
        ORDER BY CURRENT_TIMESTAMP`;
                    sqlQuery += ` 
        OFFSET ${query.skip || 0} ROWS`;
                    sqlQuery += ` 
        FETCH NEXT ${query.limit} ROWS ONLY`;
                    result = yield requ.query(sqlQuery);
                    debug(result.toString());
                    return result;
                }
                catch (er) {
                    debug(er);
                    throw er;
                }
            });
        }
        createUpdateStatement(includeId, jsonBody, id, sqlReq) {
            const parsedFieldsList = this.parseFieldsInJsonBody({ includeId: includeId, jsonBody: jsonBody, throwOnMissingFields: true, throwOnMissingModifiedOn: false, throwOnExtraFields: true, sqlReq: sqlReq });
            sqlReq.input('id', id);
            const query = `UPDATE ${this.tableName}
        SET ${parsedFieldsList.map((f) => {
                let str = `[${f}]= `;
                str += f != 'modifiedOn' ? `@${f}` : 'GETDATE()';
                return str;
            }).join(', ')} 
        WHERE Id = @id
        SELECT * from ${this.tableName}
        WHERE Id = @id
        `;
            debug(query);
            return query;
        }
        insert(jsonBody) {
            return __awaiter(this, void 0, void 0, function* () {
                let result = null;
                let msg = '';
                try {
                    // note that the check for existing id must already be done.
                    const requestIns = new sql.Request(this.connectionPool);
                    result = yield requestIns.query(this.createInsertIntoStatement(!this.autoGeneratedPrimaryKey, jsonBody, requestIns));
                    if (result.rowsAffected[0] != 0) {
                        msg = 'item created';
                    }
                    debug('return of insert', result);
                    return result;
                }
                catch (err) {
                    debug(err);
                    throw err;
                }
            });
        }
        getById(id) {
            return __awaiter(this, void 0, void 0, function* () {
                const requ = new sql.Request(this.connectionPool);
                debug('select by id: ', `select * from ${this.tableName} where Id= @id`);
                requ.input('id', id);
                let result = yield requ.query(`select * from ${this.tableName} where Id= @id`);
                debug('return of check for the same id', result);
                let item = null;
                if (!!result.recordset && result.recordset.length === 1) {
                    item = result.recordset[0];
                }
                return item;
            });
        }
        delete(id) {
            return __awaiter(this, void 0, void 0, function* () {
                let result = null;
                const requ = new sql.Request(this.connectionPool);
                result = yield requ.query(this.createDeleteStatement(id, requ));
                debug('return of check for the delete statement', result);
                return true;
            });
        }
        update(jsonBody, id) {
            return __awaiter(this, void 0, void 0, function* () {
                let result = null;
                let requ = new sql.Request(this.connectionPool);
                debug('update query');
                result = yield requ.query(this.createUpdateStatement(!this.autoGeneratedPrimaryKey, jsonBody, id, requ));
                debug('result of update ', result);
                if (typeof result.recordset[0] == 'undefined') {
                    throw new Error('server error');
                }
                return result.recordset[0];
            });
        }
    }
    Helpers.SqlTableType = SqlTableType;
})(Helpers = exports.Helpers || (exports.Helpers = {}));
//# sourceMappingURL=misc.js.map