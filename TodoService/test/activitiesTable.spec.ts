import {ActivitiesTable} from '../src/dal/activitiesTable';
import {expect} from 'chai';
import 'mocha';

describe('Activities table', function() {
  it('preParseJson should remove category and set categoryId', function(){
    const connectionPool:any={};
    // let at: ActivitiesTable;
    const fakedJsonBody: any = { category: { id: 1, title: 'titled' } };
    const result = ActivitiesTable.preParseJson(fakedJsonBody) as any;
    // expect(true).to.equal(true);
    expect(result.categoryId).to.equal(1);
    // expect(result).to.exist;
  });
  it('preParseJSON should not remove categoryId in case category does not exist')
});