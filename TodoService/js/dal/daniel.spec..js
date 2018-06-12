"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//import { ActivitiesTable } from './activitiesTable';
require("mocha");
const chai_1 = __importDefault(require("chai"));
const chai_http_1 = __importDefault(require("chai-http"));
let app = require('../app');
let should = chai_1.default.should();
chai_1.default.use(chai_http_1.default);
describe('daniels test', () => {
    it('Test GET activities route', (done) => {
        chai_1.default.request(app)
            .get('/activities')
            .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            done();
        });
    });
});
//# sourceMappingURL=daniel.spec..js.map