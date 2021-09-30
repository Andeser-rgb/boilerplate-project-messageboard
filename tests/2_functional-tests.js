const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

    test('Creating a new thread: POST request to /api/threads/{board}', done => {
        chai.request(server).
            post('/api/threads/general/').
            send({
                text: 'Hai la madre particolare',
                delete_password: 'troia'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.redirects[0].slice(-11), '/b/general/');
                done();
            });

    });
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', (done) => {
        chai.request(server).
            get('/api/threads/general/').
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.isAtMost(res.body.length, 10);
                assert.isAtMost(res.body[0].replies.length, 3);
                done();

            });
    }).timeout(5000);

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', done => {
        chai.request(server).
            delete('/api/threads/general/').
            send({
                board: 'general',
                thread_id: '6155caf251ee78760625bac3',
                delete_password: '########'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', done => {
        chai.request(server).
            delete('/api/threads/general/').
            send({
                board: 'general',
                thread_id: '6155cf26d7494abd4df46cc9',
                delete_password: 'troia'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', done => {
        chai.request(server).
            put('/api/threads/general/').
            send({
                board: 'general',
                thread_id: '6155caf251ee78760625bac3'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            });
    });

    test('Creating a new reply: POST request to /api/replies/{board}', done => {
        chai.request(server).
            post('/api/replies/general').
            send({
                board: 'general',
                thread_id: '6155caf251ee78760625bac3',
                text: 'comment',
                delete_password: 'snake case'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.redirects[0].slice(-11), '/b/general/');
                done();
            });
    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', done => {
        chai.request(server).
            get('/api/replies/general').
            query({
                thread_id: '6155caf251ee78760625bac3'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.body._id, '6155caf251ee78760625bac3');
                done();
            });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', done => {
        chai.request(server).
            delete('/api/replies/general/').
            send({
                board: 'general',
                thread_id: '6155caf251ee78760625bac3',
                reply_id: '6155d3a4f4b5f1dcacdb420b',
                delete_password: 'paolo case'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'incorrect password');
                done();
            });
    });
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with an invalid delete_password', done => {
        chai.request(server).
            delete('/api/replies/general/').
            send({
                board: 'general',
                thread_id: '6155caf251ee78760625bac3',
                reply_id: '6155d3a4f4b5f1dcacdb420b',
                delete_password: 'snake case'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', done => {
        chai.request(server).
            put('/api/threads/general/').
            send({
                board: 'general',
                thread_id: '6155caf251ee78760625bac3',
                reply_id: '6155d3a4f4b5f1dcacdb420b'
            }).
            end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'success');
                done();
            });
    });
});
