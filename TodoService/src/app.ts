import express = require('express');
import dbg = require('debug');
import h = require('./helpers/misc');
import sql = require('mssql');
import config = require('../config/sql.js');
import bodyParser = require('body-parser');
import baseRouter = require('./routers/baseRouter');
import odataV4Sql = require('odata-v4-sql');
import fileUpload = require('express-fileupload');
import acsTable = require('./dal/activitiesTable');
import acRouter = require('./routers/activitiesRouter');
import tdRouter = require('./routers/todosRouter');
import tdsTable = require('./dal/todosTable');
import { SqlTableType } from './dal/sqlTableType';
import { CardTypesTable } from './dal/cardTypesTable';

const debug = dbg('todo:api');

class main {
  public run(): void {
    debug.enabled = true;

    process.on('unhandledRejection', err => {
      debug('unhandledRejection ', err);
    });

    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(fileUpload());
    app.get(['/get', '/'], (req, res) => {
      res.send('Todo service apis.');
    });

    const pool: sql.ConnectionPool = new sql.ConnectionPool(config, err => {
      if (err) {
        debug('error in getting the connection pool');
        throw err;
      }
      const categoryFields: h.Helpers.SqlField[] = [
        new h.Helpers.SqlField({
          name: 'id',
          type: sql.BigInt,
        }),
        new h.Helpers.SqlField({
          name: 'title',
          type: sql.NVarChar(100),
        }),
        new h.Helpers.SqlField({
          name: 'sortId',
          type: sql.Int,
        }),
        new h.Helpers.SqlField({
          name: 'modifiedOn',
          type: sql.DateTime,
        }),
      ];
      const categoriesTable: SqlTableType = new SqlTableType({
        connectionPool: pool,
        tableName: 'categories',
        viewName: 'categories',
        fields: categoryFields,
        autoGeneratedPrimaryKey: true,
        throwOnExtraFields: true,
      });
      const cr: baseRouter.BaseRouter = new baseRouter.BaseRouter({
        table: categoriesTable,
        disableGetAll: false,
        disablePost: false,
        disablePut: false,
        disablePatch: true,
        disableDelete: false,
      });
      app.use('/categories', cr.router);

      const tagFields: h.Helpers.SqlField[] = [
        new h.Helpers.SqlField({
          name: 'id',
          type: sql.BigInt,
        }),
        new h.Helpers.SqlField({
          name: 'title',
          type: sql.NVarChar(100),
        }),
        new h.Helpers.SqlField({
          name: 'sortId',
          type: sql.Int,
        }),
        new h.Helpers.SqlField({
          name: 'modifiedOn',
          type: sql.DateTime,
        }),
      ];
      const tagsTable: SqlTableType = new SqlTableType({
        connectionPool: pool,
        tableName: 'tags',
        viewName: 'tags',
        fields: tagFields,
        autoGeneratedPrimaryKey: true,
        throwOnExtraFields: true,
      });
      const tagsRouter: baseRouter.BaseRouter = new baseRouter.BaseRouter({
        table: tagsTable,
        disableGetAll: false,
        disablePost: false,
        disablePut: false,
        disablePatch: true,
        disableDelete: false,
      });
      app.use('/tags', tagsRouter.router);

      const cardTypesTable: CardTypesTable = new CardTypesTable(pool);
      const cardTypesRouter: baseRouter.BaseRouter = new baseRouter.BaseRouter({
        table: cardTypesTable,
        disableGetAll: false,
        disablePost: false,
        disablePut: false,
        disablePatch: true,
        disableDelete: false,
      });
      app.use('/cardTypes', cardTypesRouter.router);

      const activitiesTable: acsTable.ActivitiesTable = new acsTable.ActivitiesTable(
        pool,
      );
      const activitiesRouter: acRouter.ActivitiesRouter = new acRouter.ActivitiesRouter(
        {
          table: activitiesTable,
          disableGetAll: false,
          disablePost: false,
          disablePut: false,
          disablePatch: true,
          disableDelete: false,
        },
      );
      app.use('/activities', activitiesRouter.router);

      const todosTable: tdsTable.TodosTable = new tdsTable.TodosTable(pool);
      const todosRouter: tdRouter.TodosRouter = new tdRouter.TodosRouter({
        table: todosTable,
        disableGetAll: false,
        disablePost: true,
        disablePut: false,
        disablePatch: false,
        disableDelete: false,
      });
      app.use('/todos', todosRouter.router);
    });

    const port = process.env.PORT || 3000;
    app.listen(port, function(): void {
      debug(`listening on port ${port}`);
    });
  }
}
let m: main = new main();
m.run();
