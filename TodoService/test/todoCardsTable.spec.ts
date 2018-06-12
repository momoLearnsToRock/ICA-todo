import { TodoCardsTable } from '../src/dal/todoCardsTable';
import { expect } from 'chai';
import 'mocha';

describe('TodoCards table', function () {
  const connectionPool: any = {};
  let table: TodoCardsTable = new TodoCardsTable(connectionPool);
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