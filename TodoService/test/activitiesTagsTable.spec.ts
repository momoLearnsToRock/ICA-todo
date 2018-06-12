import { ActivitiesTagsTable } from '../src/dal/activitiesTagsTable';
import { expect } from 'chai';
import 'mocha';

describe('ActivitiesTags table', function () {
  const connectionPool: any = {};
  let table: ActivitiesTagsTable = new ActivitiesTagsTable(connectionPool);

  it('Update activity tag requires the parameter activityId', function () {
    (async function () {
      const mockJsonBody: any = {};
      try {
        await table.customUpdateChecks(mockJsonBody)
      } catch (e) {
        expect(e.message).to.equal(`Body is missing the field 'activityId'`);
      }
    }());
  });

  it('Update activity tag requires the parameter tagId', function () {
    (async function () {
      const mockJsonBody: any = { activityId: 1 };
      try {
        await table.customUpdateChecks(mockJsonBody)
      } catch (e) {
        expect(e.message).to.equal(`Body is missing the field 'tagId'`);
      }
    }());
  });
});