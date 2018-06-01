import sql = require("mssql");
import dbg = require("debug");

const debug = dbg("todo:helpers");
export namespace Helpers {
  export class ResponseDTO {
    public message: string;
    public data: any;
    constructor({ message, data }: { message: string; data: any }) {
      this.message = message;
      this.data = data;
    }
  }
  export class SqlField {
    public name: string;
    public type: sql.ISqlTypeFactory;
    constructor({ name, type }: { name: string; type: sql.ISqlTypeFactory }) {
      this.name = name;
      this.type = type;
    }
  }

  export class TableType {
    public tableName: string; // the table name used for update, delete and post
    public viewName: string; // the view name used for selects (in many cases view name and table name are the same)
    public throwOnExtraFields: boolean; //TODO: maybe this is not needed anymore now that we have viewName and tableName
    constructor(
      tableName: string,
      viewName: string,
      throwOnExtraFields: boolean
    ) {
      this.tableName = tableName;
      this.viewName = viewName;
      this.throwOnExtraFields = throwOnExtraFields;
    }
  }
}
