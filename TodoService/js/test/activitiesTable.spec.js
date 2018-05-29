"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const activitiesTable_1 = require("../src/dal/activitiesTable");
const chai_1 = require("chai");
require("mocha");
describe('Activities table', function () {
    it('preParseJson should remove category and set categoryId', function () {
        const connectionPool = {};
        // let at: ActivitiesTable;
        const fakedJsonBody = { category: { id: 1, title: 'titled' } };
        const result = activitiesTable_1.ActivitiesTable.preParseJson(fakedJsonBody);
        // expect(true).to.equal(true);
        chai_1.expect(result.categoryId).to.equal(1);
        // expect(result).to.exist;
    });
    it('preParseJSON should not remove categoryId in case category does not exist');
});
//# sourceMappingURL=activitiesTable.spec.js.map