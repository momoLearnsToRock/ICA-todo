import baseRouter = require("./baseRouter");
import h = require("../helpers/misc");
import dbg = require("debug");
import express = require("express");
import http = require("http");
import { SqlTableType } from "../dal/sqlTableType";
import { ActivitiesTable } from "../dal/activitiesTable";

export class ActivitiesRouter extends baseRouter.BaseRouter {
  constructor({
    table,
    disableGetAll,
    disablePost,
    disablePut,
    disablePatch,
    disableDelete
  }: {
      table: ActivitiesTable;
      disableGetAll: boolean;
      disablePost: boolean;
      disablePut: boolean;
      disablePatch: boolean;
      disableDelete: boolean;
    }) {
    super({
      table: table,
      disableGetAll: disableGetAll,
      disablePost: disablePost,
      disablePut: disablePut,
      disablePatch: disablePatch,
      disableDelete: disableDelete
    });

    this.router
      .route("/:id/instantiateTodo")
      .get((req, res) => {
        res.send("try using the post verb");
      })
      .post((req, res) => {
        (async function query(this: any) {
          let result = null;
          try {
            if ((req as any).itemById == null) {
              throw new Error("Could not find an entry with the given id.");
            }
            result = await this.table.instantiateTodo(
              req.body,
              (req as any).itemById
            );
            res.send(result);
          } catch (err) {
            let code: number = 500;
            switch (true) {
              case "Could not find an entry with the given id." == err.message:
              case "error" == err.message:
              case /^Body is missing the field/.test(err.message):
              case /^No fields could be parsed from body./.test(err.message):
              case /^The field '.*' entity.$/.test(err.message):
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      });
    // #region ActivityTags
    this.router
      .route("/:activityId/tags")
      .get((req, res) => {
        (async function query(this: any) {
          try {
            let reqUrl = `$filter=activityId eq ${req.params.activityId}`;

            let rslt = await this.table.activitiesTagsTable.getAll(reqUrl);
            res.send(rslt);
          } catch (err) {
            console.log(err);
            let code: number = 500;
            switch (true) {
              case "error" == err.message:
              case /^Parse error:/.test(err.message):
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      })
      .post((req, res) => {
        (async function query(this: any) {
          try {
            if (req.body.id) {
              if (this.table.activitiesTagsTable.autoGeneratedPrimaryKey) {
                throw new Error(
                  "id should not be passed, it will be generated by the system"
                );
              }
            }
            req.body.activityId = req.params.activityId;
            let insResult = await this.table.activitiesTagsTable.insert(
              req.body,
              true
            ); // the second parameter makes sure all the needed fields are passed
            res.status(201).send(insResult);
          } catch (err) {
            let code: number = 500;
            switch (true) {
              case "an existing item already exists" == err.message:
                code = 409;
                break;
              case "error" == err.message:
              case "id should not be passed, it will be generated by the system" ==
                err.message:
              case /^Body is missing the field/.test(err.message):
              case /^No fields could be parsed from body./.test(err.message):
              case /^The field '.*' entity.$/.test(err.message):
              case /^Could not find '.*' with the id: '.*'./.test(err.message):
              case /^An item with given identifier already exists.$/.test(
                err.message
              ):
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      });

    this.router.use("/:activityId/tags/:tagId", (req, res, next) => {
      (async function query(this: any) {
        try {
          let reqUrl = `$filter=(activityId eq ${req.params.activityId} and tagId eq ${req.params.tagId})`;
          let rslt = await this.table.activitiesTagsTable.getAll(reqUrl);
          if (!rslt || rslt.length == 0) {
            throw new Error(`Could not find an entry with the given id.`);
          }
          (<any>req).activityTagById = rslt[0];
          if (req.body.id && req.body.id !== (<any>req).activityTagById.id) {
            res
              .status(400)
              .send("Wrong id was passed as part of the request body.");
          }
          next();
        } catch (err) {
          let code: number = 500;
          switch (err.message) {
            case "error":
            case "Wrong id was passed as part of the request body.":
              code = 400;
            case "Could not find an entry with the given id.":
              code = 404;
              break;
          }
          res.status(code).send(err.message);
        }
      }.bind(this)());
    });

    this.router
      .route("/:activityId/tags/:tagId")
      .get((req, res) => {
        // if (req.itemById == null) {
        //   res.status(204).send({});
        // } else {
        let tag = (<any>req).activityTagById;
        res.send(tag);
        // }
      })
      .post((req, res) => {
        this.methodNotAvailable(
          res,
          `"post"`,
          `try using "post" on the address "activities/${
          req.params.activityId
          }/tags" instead of "activities/${req.params.activityId}/tags/${
          req.params.tagId
          }"`
        );
      })
      .put((req, res) => {
        this.methodNotAvailable(res, "put", "");
      })
      .patch((req, res) => {
        this.methodNotAvailable(res, "patch", "");
      })
      .delete((req, res) => {
        (async function query(this: any) {
          try {
            if ((req as any).activityTagById == null) {
              throw new Error("Could not find an entry with the given id.");
            }
            await this.table.activitiesTagsTable.delete(
              (req as any).activityTagById.id
            );
            res.status(204).send();
          } catch (err) {
            let code: number = 500;
            switch (err.message) {
              case "Could not find an entry with the given id.":
              case "error":
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      });
    // #endregion ActivityTags
    //#region ActivityCards
    this.router
      .route("/:activityId/cards")
      .get((req, res) => {
        (async function query(this: any) {
          try {
            let reqUrl = `$filter=activityId eq ${req.params.activityId}`;

            let rslt = await this.table.activityCardsTable.getAll(reqUrl);
            res.send(rslt);
          } catch (err) {
            console.log(err);
            let code: number = 500;
            switch (true) {
              case "error" == err.message:
              case /^Parse error:/.test(err.message):
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      })
      .post((req, res) => {
        (async function query(this: any) {
          try {
            if (req.body.id) {
              if (this.table.activityCardsTable.autoGeneratedPrimaryKey) {
                throw new Error(
                  "id should not be passed, it will be generated by the system"
                );
              }
            }
            req.body.activityId = req.params.activityId;
            let insResult = await this.table.activityCardsTable.insert(
              req.body,
              true
            ); // the second parameter makes sure all the needed fields are passed
            res.status(201).send(insResult);
          } catch (err) {
            let code: number = 500;
            switch (true) {
              case "an existing item already exists" == err.message:
                code = 409;
                break;
              case "error" == err.message:
              case "id should not be passed, it will be generated by the system" ==
                err.message:
              case /^Body is missing the field/.test(err.message):
              case /^No fields could be parsed from body./.test(err.message):
              case /^The field '.*' entity.$/.test(err.message):
              case /^Could not find '.*' with the id: '.*'./.test(err.message):
              case /^An item with given identifier already exists.$/.test(
                err.message
              ):
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      });

    this.router.use("/:activityId/cards/:cardId", (req, res, next) => {
      (async function query(this: any) {
        try {
          let reqUrl = `$filter=(activityId eq ${
            req.params.activityId
            } and id eq ${req.params.cardId})`;
          let rslt = await this.table.activityCardsTable.getAll(reqUrl);
          if (!rslt || rslt.length == 0) {
            throw new Error(`Could not find an entry with the given id.`);
          }
          (<any>req).activityCardById = rslt[0];
          if (req.body.id && req.body.id !== (<any>req).activityCardById.id) {
            res
              .status(400)
              .send("Wrong id was passed as part of the request body.");
          }
          next();
        } catch (err) {
          let code: number = 500;
          switch (err.message) {
            case "error":
            case "Wrong id was passed as part of the request body.":
              code = 400;
            case "Could not find an entry with the given id.":
              code = 404;
              break;
          }
          res.status(code).send(err.message);
        }
      }.bind(this)());
    });

    this.router
      .route("/:activityId/cards/:cardId")
      .get((req, res) => {
        if ((<any>req).itemById == null) {
          res.status(204).send({});
        } else {
          res.send((<any>req).activityCardById);
        }
      })
      .post((req, res) => {
        this.methodNotAvailable(
          res,
          `"post"`,
          `try using "post" on the address "activities/${
          req.params.activityId
          }/cards" instead of "activities/${req.params.activityId}/cards/${
          req.params.cardId
          }"`
        );
      })
      .put((req, res) => {
        (async function query(this: any) {
          let result = null;
          try {
            if ((<any>req).activityCardById == null) {
              throw new Error("Could not find an entry with the given id.");
            }
            result = await this.table.activityCardsTable.update(
              req.body,
              req.params.cardId,
              true
            ); // the last argument makes sure to throw an error if there is a field missing (otherwise it should be patch)
            res.send(result);
          } catch (err) {
            let code: number = 500;
            switch (true) {
              case "Could not find an entry with the given id." == err.message:
              case "error" == err.message:
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
      .patch((req, res) => {
        (async function query(this: any) {
          let result = null;
          try {
            if ((<any>req).activityCardById == null) {
              throw new Error("Could not find an entry with the given id.");
            }
            result = await this.table.activityCardsTable.update(
              req.body,
              req.params.cardId,
              false
            );
            res.send(result);
          } catch (err) {
            let code: number = 500;
            switch (true) {
              case "Could not find an entry with the given id." == err.message:
              case "error" == err.message:
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
      .delete((req, res) => {
        (async function query(this: any) {
          try {
            if ((req as any).activityCardById == null) {
              throw new Error("Could not find an entry with the given id.");
            }
            await this.table.activityCardsTable.delete(
              (req as any).activityCardById.id
            );
            res.status(204).send();
          } catch (err) {
            let code: number = 500;
            switch (err.message) {
              case "Could not find an entry with the given id.":
              case "error":
                code = 400;
                break;
            }
            res.status(code).send(err.message);
          }
        }.bind(this)());
      });
    // #endregion ActiviyCards
  }
}
