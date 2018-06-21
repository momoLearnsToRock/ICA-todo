/***
 * Manually clean up database (in case somethings goes wrong): 
delete from TodoCardsBase where cardType = 'TEST';
delete from TodosBase where assignedToId = 'testid'
delete from ActivityCardsBase where cardType = 'TEST'
delete from ActivitiesBase where title = 'updated title'
delete from Categories where title = 'test category'
delete from Tags where title = 'test tag'
delete from CardTypes where id = 'TEST'
 *
 * ***/

import 'mocha';
import chai from 'chai';
import chaiHttp from 'chai-http';
const fs = require('fs');
let should = chai.should();
chai.use(chaiHttp);

// Url root for API calls
let server = "localhost:3000";

// Current datetime
let now = new Date().toLocaleString()

// Object that will be created
let tagObj = { title: 'test tag', sortId: 1 }
let categoryObj = { title: 'test category', sortId: 1 }
let cardTypeObj = { id: 'TEST', title: 'Test' };
let activityObj = { note: 'test note', contentUrl: 'https://content.url', title: 'test title', activityType: 'basic', priority: 1, categoryId: 0 };
let activityUpdatedObj = { note: 'updated note', createdAt: now, contentUrl: 'https://content.url', title: 'updated title', activityType: 'basic', priority: 1, categoryId: 0 };
let activityCardObj = { activityId: 0, notes: "Test card", cardType: 'TEST', input: 'Test input', outputText: 'Test output text' };
let todoCardObj = { notes: "Test card", cardType: 'TEST', input: 'Test input', outputText: 'Test output text', outputMedia: null };

// Additional parameters to instantiate todo
let instantiateTodoParams = { dueAt: now, assignedToId: 'testid', assignedToName: 'Test Group', assignedToObjectType: 'Group', createdById: 'test.user', createdByName: 'Test User' };
let assignee = { assignedToId: 'testid', assignedToName: 'Test Group', assignedToObjectType: 'Group' };

// Parameters
let tagId = 0;
let activityId = 0;
let todoId = 0;
let categoryId = 0;
let cardTypeId = 'TEST';
let todoCardId1 = 0;
let todoCardId2 = 0;
let activityCardId = 0;
let activityTagId = 0;
let attachment = '';

describe('Test routes', () => {

  it('GET /tags => Get all tags', (done) => {
    chai.request(server)
      .get('/tags/')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })

  it('POST /tags => Create tag', (done) => {
    chai.request(server)
      .post('/tags/')
      .type('form')
      .send(tagObj)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        tagId = res.body.id;
        done();
      });
  })

  it('PUT /tags/:id => Get tag by id', (done) => {
    chai.request(server)
      .put('/tags/' + tagId)
      .type('form')
      .send(tagObj)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

  it('GET /categories => Get all categories', (done) => {
    chai.request(server)
      .get('/categories/')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })

  it('POST /categories => Create category', (done) => {
    chai.request(server)
      .post('/categories/')
      .type('form')
      .send(categoryObj)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        categoryId = res.body.id;
        // use newly created category
        activityObj.categoryId = res.body.id;
        activityUpdatedObj.categoryId = res.body.id;
        done();
      });
  })

  it('PUT /category/:id => Update category', (done) => {
    chai.request(server)
      .put('/categories/' + categoryId)
      .type('form')
      .send(categoryObj)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

  it('GET /cardtypes => Get all card types', (done) => {
    chai.request(server)
      .get('/cardtypes/')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })

  it('POST /cardtypes => Create category', (done) => {
    chai.request(server)
      .post('/cardtypes/')
      .type('form')
      .send(cardTypeObj)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        cardTypeId = res.body.id;
        done();
      });
  })

  it('PUT /cardtypes/:id => Update card type', (done) => {
    chai.request(server)
      .put('/cardtypes/' + cardTypeId)
      .type('form')
      .send(cardTypeObj)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

  it('GET /activities => Get all activities', (done) => {
    chai.request(server)
      .get('/activities')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })

  it('POST /activities => Create activity', (done) => {
    chai.request(server)
      .post('/activities/')
      .type('form')
      .send(activityObj)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        activityId = res.body.id;
        activityCardObj.activityId = res.body.id;
        done();
      });
  })

  it('GET /activities/:id => Get activity by id', (done) => {
    chai.request(server)
      .get('/activities/' + activityId)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

  it('PATCH /activities/:id => Not allowed, 405', (done) => {
    chai.request(server)
      .patch('/activities/' + activityId)
      .type('form')
      .send({})
      .end((err, res) => {
        res.should.have.status(405);
        done();
      });
  })

  it('PUT /activities/:id => Update activity', (done) => {
    chai.request(server)
      .put('/activities/' + activityId)
      .type('form')
      .send(activityUpdatedObj)
      .end((err, res) => {
        res.should.have.status(200);
        done();
      });
  })

  it('POST /activities/:id/tags => Set tag for activity', (done) => {
    chai.request(server)
      .post('/activities/' + activityId + '/tags/')
      .type('form')
      .send({tagId: tagId})
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        activityTagId = res.body.id;
        done();
      });
  })

  it('GET /activities/:id/tags => Get tags for an activity', (done) => {
    chai.request(server)
      .get('/activities/' + activityId + '/tags/')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })

  it('GET /activities/:id/tags/:id => Get tag for an activity by id', (done) => {
    chai.request(server)
      .get('/activities/' + activityId + '/tags/' + tagId)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

  it('POST /activities/:id/cards => Create activity card', (done) => {
    chai.request(server)
      .post('/activities/' + activityId + '/cards/')
      .type('form')
      .send(activityCardObj)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        activityCardId = res.body.id;
        done();
      });
  })

  it('GET /activities/:id/cards/:id => Get activity card for an activity by id', (done) => {
    chai.request(server)
      .get('/activities/' + activityId + '/cards/' + activityCardId)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

  it('POST /activities/:id/instantiatetodo => Create a todo from an activity', (done) => {
    chai.request(server)
      .post('/activities/' + activityId + '/instantiatetodo')
      .type('form')
      .send(instantiateTodoParams)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('id');
        // assign todo ids to objects
        todoId = res.body.id;
        todoCardId1 = JSON.parse(res.body.cards)[0].id; // should only have one card
        done();
      });
  })

  it('GET /todos => Get all todos', (done) => {
    chai.request(server)
      .get('/todos/')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })

  it('GET /todos/:id => Get todo by id', (done) => {
    chai.request(server)
      .get('/todos/' + todoId)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

  it('GET /todos/:id/cards => Get todo cards for a todo', (done) => {
    chai.request(server)
      .get('/todos/' + todoId + '/cards/')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        done();
      });
  })

  it('POST /todos/:id/cards => Create todo card', (done) => {
    chai.request(server)
      .post('/todos/' + todoId + '/cards/')
      .send(todoCardObj)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.be.a('object');
        todoCardId2 = res.body.id
        done();
      });
  })

  it('GET /todos/:id/cards/:id => Get todo card for a todo by id', (done) => {
    chai.request(server)
      .get('/todos/' + todoId + '/cards/' + todoCardId2)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array'); // a single card is returned as an object in an array (?)
        done();
      });
  })

  it('POST /todos/:id/cards/:id/attachment => Add attachment to a todo card', (done) => {
    chai.request(server)
      .post('/todos/' + todoId + '/cards/' + todoCardId2 + '/attachment/')
      .attach('attachment', fs.readFileSync('./test/testfile.txt'), 'testFile.txt')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        attachment = res.body.fileName;
        done();
      });
  })

  it('GET /todos/:id/cards/:id/attachment/:filename => Get attachment for a todo card by filename', (done) => {
    chai.request(server)
      .get('/todos/' + todoId + '/cards/' + todoCardId2 + '/attachment/' + attachment)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        done();
      });
  })

});

/*
 *  CLEAN UP DATABASE & TEST DELETE
 */

describe('Clean up after testing routes', () => {

  it('DELETE /todos/:id/cards/:id (card 1)', (done) => {
    chai.request(server)
      .del('/todos/' + todoId + '/cards/' + todoCardId1)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /todos/:id/cards/:id (card 2)', (done) => {
    chai.request(server)
      .del('/todos/' + todoId + '/cards/' + todoCardId2)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /todos/:id', (done) => {
    chai.request(server)
      .del('/todos/' + todoId)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /activities/:id/tags/:id', (done) => {
    chai.request(server)
      .del('/activities/' + activityId + '/tags/' + tagId)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /activities/:id/cards/:id', (done) => {
    chai.request(server)
      .del('/activities/' + activityId + '/cards/' + activityCardId)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /activities/:id', (done) => {
    chai.request(server)
      .del('/activities/' + activityId)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /tags/:id', (done) => {
    chai.request(server)
      .del('/tags/' + tagId)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /categories/:id', (done) => {
    chai.request(server)
      .del('/categories/' + categoryId)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })

  it('DELETE /cardtypes/:id', (done) => {
    chai.request(server)
      .del('/cardtypes/' + cardTypeId)
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  })
});