import { ActivitiesTable } from '../src/dal/activitiesTable';
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'mocha';

let should = chai.should();
let expect = chai.expect;

chai.use(chaiHttp);

describe('Activities table', function () {
  const connectionPool: any = {};
  let table: ActivitiesTable = new ActivitiesTable(connectionPool);

  it('Insert requires uppercase id', function () {
    (async function () {
      const fakedJsonBody: any = { id: "temp", title: 'Temprature' };
      try {
        await table.customInsertChecks(fakedJsonBody)
      } catch (e) {
        expect(e.message).to.equal(`the field 'id' has an invalid value.`);
      }
    }());
  });

  it('Instantiate Todo requires the parameter assignedToId', function () {
    (async function () {
      const mockJsonBody: any = {};
      const mockActivity: any = {};
      try {
        await table.instantiateTodo(mockJsonBody, mockActivity)
      } catch (e) {
        expect(e.message).to.equal(`Body is missing the field 'assignedToId'`);
      }
    }());
  });

  it('Instantiate Todo requires the parameter assignedToName', function () {
    (async function () {
      const mockJsonBody: any = { assignedToId: "d290f1ee-6c54-4b01-90e6-d701748f0851" };
      const mockActivity: any = {};
      try {
        await table.instantiateTodo(mockJsonBody, mockActivity)
      } catch (e) {
        expect(e.message).to.equal(`Body is missing the field 'assignedToName'`);
      }
    }());
  });

  it('Instantiate Todo requires the parameter assignedToObjectType', function () {
    (async function () {
      const mockJsonBody: any = { assignedToId: "d290f1ee-6c54-4b01-90e6-d701748f0851", assignedToName: "Frukt & Grönt" };
      const mockActivity: any = {};
      try {
        await table.instantiateTodo(mockJsonBody, mockActivity)
      } catch (e) {
        expect(e.message).to.equal(`Body is missing the field 'assignedToObjectType'`);
      }
    }());
  });

  it('preParseJson should remove category and set categoryId', function () {
    const connectionPool: any = {};
    const fakedJsonBody: any = { category: { id: 1, title: 'titled' } };
    const result = ActivitiesTable.preParseJson(fakedJsonBody) as any;
    expect(result.categoryId).to.equal(1);
  });

});