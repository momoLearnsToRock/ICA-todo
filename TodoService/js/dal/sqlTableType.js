"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql = require("mssql");
const dbg = require("debug");
const h = require("../helpers/misc");
const odataV4Sql = require("odata-v4-sql");
const debug = dbg("todo:tableType");
class SqlTableType extends h.Helpers.TableType {
    constructor({ connectionPool, tableName, viewName, fields, autoGeneratedPrimaryKey, throwOnExtraFields }) {
        super(tableName, viewName, throwOnExtraFields);
        // this.tableName = tableName;
        this.fields = fields;
        this.autoGeneratedPrimaryKey = autoGeneratedPrimaryKey;
        this.connectionPool = connectionPool;
    }
    getFieldNames(includeId) {
        let fieldsString = "";
        this.fields.forEach((item, index) => {
            if (includeId || item.name.toLowerCase() !== "id") {
                fieldsString += item.name;
                if (index !== this.fields.length - 1) {
                    fieldsString += ", ";
                }
            }
        });
        return fieldsString;
    }
    parseFieldsInJsonBody({ includeId, jsonBody, throwOnMissingFields, throwOnMissingModifiedOn, throwOnExtraFields, sqlReq, queryFields }) {
        const parsedFieldsList = [];
        queryFields.forEach((item, index) => {
            if (includeId || item.name.toLowerCase() !== "id") {
                if (item.name === "modifiedOn") {
                    if (throwOnMissingModifiedOn &&
                        typeof jsonBody[item.name] == "undefined") {
                        throw new Error(`Body is missing the field '${item.name}'.`);
                    }
                }
                else {
                    if (throwOnMissingFields &&
                        typeof jsonBody[item.name] == "undefined") {
                        throw new Error(`Body is missing the field '${item.name}'.`);
                    }
                    if (typeof jsonBody[item.name] == "undefined") {
                        return;
                    }
                    sqlReq.input(item.name, item.type, item.type == sql.DateTime
                        ? !jsonBody[item.name] ? null : new Date(jsonBody[item.name])
                        : jsonBody[item.name]);
                }
                parsedFieldsList.push(item.name);
            }
        });
        if (parsedFieldsList.length == 0) {
            throw new Error("No fields could be parsed from body.");
        }
        if (throwOnExtraFields) {
            let bodyKeys = Object.keys(jsonBody);
            bodyKeys.forEach((item, index) => {
                if (queryFields
                    .map((f) => {
                    return f.name;
                })
                    .indexOf(item) < 0) {
                    throw new Error(`The field '${item}' does not exist on the '${this.tableName}' entity. Try removing it from the body.`);
                }
            });
        }
        return parsedFieldsList;
    }
    createInsertIntoStatement(includeId, jsonBody, sqlReq, throwOnMissingFields) {
        const parsedFieldsList = this.parseFieldsInJsonBody({
            includeId: includeId,
            jsonBody: jsonBody,
            throwOnMissingFields: throwOnMissingFields,
            throwOnMissingModifiedOn: false,
            throwOnExtraFields: this.throwOnExtraFields,
            sqlReq: sqlReq,
            queryFields: this.fields
        });
        const indexOfId = this.fields
            .map(f => {
            return f.name;
        })
            .indexOf("id");
        const PKType = this.fields[indexOfId].type;
        let PKTypeAsString = !!PKType.length ? `${PKType.type.declaration}(${PKType.length})` : `${PKType.declaration}`; //handling both nchar and integer keys also uniqueidentifiers
        const query = `DECLARE @_keys table([id] ${PKTypeAsString})

     INSERT INTO ${this.tableName} (${parsedFieldsList
            .map(f => {
            return `[${f}]`;
        })
            .join(", ")}) 
     OUTPUT inserted.id INTO @_keys
     VALUES (${parsedFieldsList
            .map(f => {
            return f == "modifiedOn" ? "GETDATE()" : `@${f}`;
        })
            .join(", ")})

     SELECT t.*
     FROM @_keys AS g 
     JOIN dbo.${this.viewName} AS t 
     ON g.id = t.id`;
        // this method is a copy of what EF does
        return query;
    }
    createDeleteStatement(id, sqlReq) {
        sqlReq.input("id", id);
        return `DELETE FROM ${this.tableName} WHERE id = @id`;
    }
    async getAll(q) {
        if (!q || q == "/" || q == "/?") {
            q = "$top=100";
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
            let sqlQuery = `select ${query.select} from ${this.viewName}`;
            let where = query.where;
            if (where) {
                for (let p of query.parameters) {
                    if (where.indexOf("?") < 0) {
                        throw new Error(`Parse error: could not parse near '${p[1]}'`);
                    }
                    requ.input(`${p[0]}`, `${p[1]}`);
                    where = where.replace("?", `@${p[0]}`);
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
            result = await requ.query(sqlQuery);
            debug(result.toString());
            return result.recordset;
        }
        catch (er) {
            debug(er);
            throw er;
        }
    }
    createUpdateStatement(includeId, jsonBody, id, sqlReq, throwOnMissingFields) {
        const parsedFieldsList = this.parseFieldsInJsonBody({
            includeId: includeId,
            jsonBody: jsonBody,
            throwOnMissingFields: throwOnMissingFields,
            throwOnMissingModifiedOn: false,
            throwOnExtraFields: true,
            sqlReq: sqlReq,
            queryFields: this.fields
        });
        sqlReq.input("id", id);
        const query = `UPDATE ${this.tableName}
      SET ${parsedFieldsList
            .map(f => {
            let str = `[${f}]= `;
            str += f != "modifiedOn" ? `@${f}` : "GETDATE()";
            return str;
        })
            .join(", ")} 
      WHERE id = @id
      SELECT * from ${this.viewName}
      WHERE id = @id
      `;
        debug(query);
        return query;
    }
    async insert(jsonBody, throwOnMissingFields) {
        return await this.insertTransPool(jsonBody, throwOnMissingFields, this.connectionPool);
    }
    async insertTransPool(jsonBody, throwOnMissingFields, transPool) {
        await this.customInsertChecks(jsonBody);
        let result = null;
        let msg = "";
        try {
            // note that the check for existing id must already be done.
            const requestIns = new sql.Request(transPool);
            result = await requestIns.query(this.createInsertIntoStatement(!this.autoGeneratedPrimaryKey, jsonBody, requestIns, throwOnMissingFields));
            if (result.rowsAffected[0] != 0) {
                msg = "item created";
            }
            debug("return of insert", result);
            return result.recordset[0];
        }
        catch (err) {
            debug(err);
            throw err;
        }
    }
    async getById(id) {
        const requ = new sql.Request(this.connectionPool);
        debug("select by id: ", `select * from ${this.viewName} where id= @id`);
        requ.input("id", id);
        let result = await requ.query(`select * from ${this.viewName} where id= @id`);
        debug("return of check for the same id", result);
        let item = null;
        if (!!result.recordset && result.recordset.length === 1) {
            item = result.recordset[0];
        }
        return item;
    }
    async delete(id) {
        let result = null;
        const requ = new sql.Request(this.connectionPool);
        result = await requ.query(this.createDeleteStatement(id, requ));
        debug("return of check for the delete statement", result);
        return true;
    }
    async update(jsonBody, id, throwOnMissingFields) {
        return await this.updateTransPool(jsonBody, id, throwOnMissingFields, this.connectionPool);
    }
    async updateTransPool(jsonBody, id, throwOnMissingFields, transPool) {
        await this.customUpdateChecks(jsonBody);
        let result = null;
        let requ = new sql.Request(transPool);
        debug("update query");
        result = await requ.query(this.createUpdateStatement(!this.autoGeneratedPrimaryKey, jsonBody, id, requ, throwOnMissingFields));
        debug("result of update ", result);
        if (typeof result.recordset[0] == "undefined") {
            throw new Error("server error");
        }
        return result.recordset[0];
    }
    async customUpdateChecks(jsonBody) {
        //custom checks here. can be overriden in children. if you find an error throw!
        return;
    }
    async customInsertChecks(jsonBody) {
        //custom checks here. can be overriden in children. if you find an error throw!
        return;
    }
}
exports.SqlTableType = SqlTableType;
//# sourceMappingURL=sqlTableType.js.map