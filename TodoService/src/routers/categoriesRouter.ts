import baseRouter = require('./baseRouter');
import h = require('../helpers/misc');
import dbg = require('debug');
import express = require('express');
import http = require('http');

export class CategoriesRouter extends baseRouter.BaseRouter {
  constructor(table: h.Helpers.SqlTableType, disableGetAll: boolean) {
    super(table, disableGetAll);
  }
}
