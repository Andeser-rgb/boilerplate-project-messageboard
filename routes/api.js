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
        replies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Reply'}]
    });

    const ReplySchema = mongoose.Schema({
        text: String,
        created_on: Date,
        delete_password: String,
        reported: Boolean
    });

    const Message = mongoose.model('Messageboard', MessageSchema);
    const Reply = mongoose.model('Reply', ReplySchema);


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
            res.redirect('/b/' + board + '/');
        })
        .get((req, res) => {
            const {
                board
            } = req.params;

            Message.find({
                board: board
            }).
            populate('replies').
            exec((err, data) => {

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
                res.send('success');
            });
        })
        .put((req, res) => {
            const {
                board,
                thread_id
            } = req.body;

            Message.findOne({
                _id: thread_id,
                board: board
            }, (err, doc) => {
                if(err) throw err;
                doc.reported = true;
                res.send('success');
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


            Message.findOne({
                _id: thread_id,
                board: board
            })
            .exec((err, doc) => {
                if (err) throw err;

                const reply = new Reply({
                    _id: new mongoose.Types.ObjectId(),
                    messageId: doc._id,
                    text: text,
                    created_on: new Date(),
                    delete_password: delete_password,
                    reported: false
                });

                doc.bumped_on = new Date();
                doc.replies.push(reply._id);
                doc.save();
                reply.save();

                res.redirect('/b/' + board + '/');
            });

        })
        .get((req, res) => {
            let board = req.params.board;
            let thread_id = req.query.thread_id;

            Message.findOne({
                board: board,
                thread_id: thread_id
            }).
            populate('replies').
            exec((err, data) => {
                if (err) throw err;
                let dataCopy = data.toObject();
                delete dataCopy.reported;
                delete dataCopy.delete_password;
                dataCopy.replies = dataCopy.replies.map(d => {
                    delete d.reported;
                    delete d.delete_password;
                    return d;
                });
                res.send(dataCopy);
            });
        })
        .delete((req, res) => {
            let {
                board,
                thread_id,
                reply_id,
                delete_password
            } = req.body;

            try{
                thread_id = mongoose.Types.ObjectId(thread_id);
                Message.findOne({
                    _id: thread_id,
                    board: board
                }, (err, doc) => {
                    if (err) throw err;
                    if(doc.replies.indexOf(reply_id) !== -1 && doc !== null)
                        Reply.findOne({_id: reply_id}, (err, repdoc) => {
                            if(repdoc.delete_password === delete_password){
                                repdoc.text = '[deleted]';
                                repdoc.save();
                                res.send('success');
                            }
                            else
                                res.send('incorrect password');
                        });
                    else
                        res.send('well well well');

                });
            }
            catch (error){
                res.send('Invalid thread_id');
            }
        })
        .put((req, res) => {
            let {
                board,
                thread_id,
                reply_id,
                delete_password
            } = req.body;

            try{
                thread_id = mongoose.Types.ObjectId(thread_id);
                Message.findOne({
                    _id: thread_id,
                    board: board
                }, (err, doc) => {
                    if (err) throw err;
                    if(doc.replies.indexOf(reply_id) !== -1 && doc !== null)
                        Reply.findOne({_id: reply_id}, (err, repdoc) => {
                               repdoc.reported = true;
                               repdoc.save();
                               res.send('success');
                        });
                    else
                        res.send('well well well');

                });
            }
            catch (error){
                res.send('invalid id');
            }
        });
};
