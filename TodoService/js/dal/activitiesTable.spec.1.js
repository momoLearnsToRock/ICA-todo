"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const activitiesTable_1 = require("./activitiesTable");
const chai_1 = require("chai");
require("mocha");
describe('Activities table', function () {
    const connectionPool = {};
    let table = new activitiesTable_1.ActivitiesTable(connectionPool);
    it('Insert requires uppercase id', function () {
        (async function () {
            const fakedJsonBody = { id: "temp", title: 'Temprature' };
            try {
                await table.customInsertChecks(fakedJsonBody);
            }
            catch (e) {
                chai_1.expect(e.message).to.equal(`the field 'id' has an invalid value.`);
            }
        }());
    });
    it('Instantiate Todo requires the paramete assignedToId', function () {
        (async function () {
            const mockJsonBody = {};
            const mockActivity = {};
            try {
                await table.instantiateTodo(mockJsonBody, mockActivity);
            }
            catch (e) {
                chai_1.expect(e.message).to.equal(`Body is missing the field 'assignedToId'`);
            }
        }());
    });
    it('Instantiate Todo requires the paramete assignedToName', function () {
        (async function () {
            const mockJsonBody = { assignedToId: "d290f1ee-6c54-4b01-90e6-d701748f0851" };
            const mockActivity = {};
            try {
                await table.instantiateTodo(mockJsonBody, mockActivity);
            }
            catch (e) {
                chai_1.expect(e.message).to.equal(`Body is missing the field 'assignedToName'`);
            }
        }());
    });
    it('Instantiate Todo requires the paramete assignedToObjectType', function () {
        (async function () {
            const mockJsonBody = { assignedToId: "d290f1ee-6c54-4b01-90e6-d701748f0851", assignedToName: "Frukt & Grönt" };
            const mockActivity = {};
            try {
                await table.instantiateTodo(mockJsonBody, mockActivity);
            }
            catch (e) {
                chai_1.expect(e.message).to.equal(`Body is missing the field 'assignedToObjectType'`);
            }
        }());
    });
});
//# sourceMappingURL=activitiesTable.spec.1.js.map