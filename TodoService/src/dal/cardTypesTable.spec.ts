import { CardTypesTable } from './cardTypesTable';
import { expect } from 'chai';
import 'mocha';

describe('CardTypes table', function () {
  const connectionPool: any = {};
  let ct: CardTypesTable = new CardTypesTable(connectionPool);
  it('insert checks should not allow ids that are lowercase', function () {
    (async function () {
      const fakedJsonBody: any = { id: "temp", title: 'Temprature' };
      try {
        await ct.customInsertChecks(fakedJsonBody)
      } catch (e) {
        expect(e.message).to.equal(`the field 'id' has an invalid value.`);
      }
    }());
  });
  it('insert checks should allow ids that are uppercase', function () {
    (async function () {
      const fakedJsonBody: any = { id: "TEMP", title: 'Temprature' };
      await ct.customInsertChecks(fakedJsonBody)
      expect(true).to.equal(true);
    }());
  });
  it('update checks should not allow ids that are lowercase', function () {
    (async function () {
      const fakedJsonBody: any = { id: "temp", title: 'Temprature' };
      try {
        await ct.customUpdateChecks(fakedJsonBody)
      } catch (e) {
        expect(e.message).to.equal(`the field 'id' has an invalid value.`);
      }
    }());
  });
  it('update checks should allow ids that are uppercase', function () {
    (async function () {
      const fakedJsonBody: any = { id: "TEMP", title: 'Temprature' };
      await ct.customUpdateChecks(fakedJsonBody)
      expect(true).to.equal(true);
    }());
  });
});