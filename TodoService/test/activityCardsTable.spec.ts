import { ActivityCardsTable } from '../src/dal/activityCardsTable';
import { expect } from 'chai';
import 'mocha';

describe('ActivityCards table', function () {
  const connectionPool: any = {};
  let table: ActivityCardsTable = new ActivityCardsTable(connectionPool);
  it('insert checks should not allow ids that are lowercase', function () {
    (async function () {
      const fakedJsonBody: any = { id: "temp", title: 'Temprature' };
      try {
        await table.customInsertChecks(fakedJsonBody)
      } catch (e) {
        expect(e.message).to.equal(`the field 'id' has an invalid value.`);
      }
    }());
  });
});