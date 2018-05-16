import baseRouter = require('./baseRouter');
import h = require('../helpers/misc');
import dbg = require('debug');
import express = require('express');
import http = require('http');

export class ActivitiesRouter extends baseRouter.BaseRouter {
  constructor({table, disableGetAll, disablePost, disablePut, disablePatch, disableDelete}
    : {table: h.Helpers.SqlTableType, disableGetAll: boolean, disablePost: boolean, disablePut: boolean, disablePatch: boolean, disableDelete: boolean}) {
    super({table: table, disableGetAll: disableGetAll, disablePost: disablePost, disablePut: disablePut, disablePatch: disablePatch, disableDelete: disableDelete});

    this.router.route('/:id/instantiateTodo')
      .get((req, res) => {
        res.send('try using the post verb');
      })
      .post((req, res) => {
        (async function query() {
          let result = null;
          try {
            if (req.itemById == null) {
              throw new Error('no data available');
            }
            result = await this.table.instantiateTodo(req.body, req.itemById);
            res.send(result);
          } catch (err) {
            let code: number = 500;
            switch (true) {
              case 'no data available' == err.message:
              case 'error' == err.message:
              case /^Body is missing the field/.test(err.message):
              case /^No fields could be parsed from body./.test(err.message):
              case /^The field '.*' entity.$/.test(err.message):
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      })

  }
}