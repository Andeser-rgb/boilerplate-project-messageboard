'use strict';

const mongoose = require('mongoose');
const uri = process.env.DB;

module.exports = function(app) {

    mongoose.connect(process.env.DB);
    const MessageSchema = mongoose.Schema({
        text: String,
        board: String,
        created_on: Date,
        bumped_on: Date,
        reported: Boolean,
        delete_password: String,
        replies: [{}]
    });

    const Message = mongoose.model('Messageboard', MessageSchema);


    app.route('/api/threads/:board')
        .post((req, res) => {
            let {
                board,
                text,
                delete_password
            } = req.body;
            if (board === undefined) board = 'general';

            const newMessage = new Message({
                text: text,
                board: board,
                created_on: new Date(),
                bumped_on: new Date(),
                reported: false,
                delete_password: delete_password,
                replies: []
            });
            newMessage.save();
            res.redirect('/b/' + board);
        })
        .get((req, res) => {
            const {
                board
            } = req.params;
            const {
                thread_id
            } = req.query;

            if (thread_id === undefined)
                Message.find({
                    board: board
                }, (err, data) => {
                    if (err) throw err;
                    data = data
                        .sort((a, b) => a.bumped_on - b.bumped_on)
                        .map((d, i) => {
                            let dCopy = d.toObject();
                            if (dCopy.replies !== [])
                                dCopy.replies = dCopy.replies
                                .sort((a, b) => a.created_on - b.created_on).slice(0, 3);
                            delete dCopy.reported;
                            delete dCopy.delete_password;
                            return dCopy;
                        });
                    res.send(data);
                });
            else
                Message.findOne({
                    board: board,
                    thread_id: thread_id
                }, (err, data) => {
                    if (err) throw err;
                    let dataCopy = data.toObject();
                    delete dataCopy.reported;
                    delete dataCopy.delete_password;
                    res.send(dataCopy);
                });
        })
        .delete((req, res) => {
            const {
                board,
                thread_id,
                delete_password
            } = req.body;

            Message.findOne({
                board: board,
                thread_id: thread_id,
            }, (err, doc) => {
                if (err) throw err;
                if(doc.delete_password != delete_password)
                    res.send('incorrect password');
                else
                    Message.deleteOne({
                        board: board,
                        thread_id: thread_id
                    });
            });
        });

    app.route('/api/replies/:board')
        .post((req, res) => {
            const {
                board,
                text,
                delete_password,
                thread_id
            } = req.body;
            if (board === undefined) board = 'general';

            Message.findOneAndUpdate({
                _id: thread_id,
                board: board
            }, (err, doc) => {
                if (err) throw err;
                doc.bumped_on = new Date();
                doc.replies.push({
                    _id: new mongoose.Types.ObjectId(),
                    text: text,
                    created_on: new Date(),
                    delete_password: delete_password,
                    reported: false
                });
                doc.save();
            });
        });
};
