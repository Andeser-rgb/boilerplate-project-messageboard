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
                text,
                delete_password
            } = req.body;
            let board = req.params.board;

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
        .get(async (req, res) => {
            const {
                board
            } = req.params;

            let data = await Message.find({
                board: board
            }).populate('replies');

            if (data == null){
                res.send([]);
                return;
            }

            data = data
                .sort((a, b) => b.bumped_on - a.bumped_on)
                .map((d, i) => {
                    let dCopy = d.toObject();
                    if (dCopy.replies !== [])
                        dCopy.replies = dCopy.replies
                        .sort((a, b) => b.created_on - a.created_on).slice(0, 3);
                    delete dCopy.reported;
                    delete dCopy.delete_password;
                    return dCopy;
                });
            res.send(data.slice(0, 10));
        })
        .delete(async (req, res) => {
            const {
                board,
                thread_id,
                delete_password
            } = req.body;

            let doc = await Message.findOne({
                board: board,
                _id: thread_id,
            });

            if(doc == null){
                res.send('No file');
                return;
            }

            if(doc.delete_password != delete_password)
                res.send('incorrect password');
            else{
                await Message.deleteOne({
                    board: board,
                    _id: thread_id
                });
                res.send('success');
            }
        })
        .put(async (req, res) => {
            const {
                board,
                thread_id
            } = req.body;

            let doc = await Message.findOne({
                _id: thread_id,
                board: board
            });

            if(doc == null){
                res.send('No file');
                return;
            }

            doc.reported = true;
            res.send('success');
        });

    app.route('/api/replies/:board')
        .post(async (req, res) => {
            let {
                board,
                text,
                delete_password,
                thread_id
            } = req.body;

            const doc = await Message.findById(thread_id);

            if(doc == null){
                res.send('Thread not found');
                return;
            }

            board = doc.board;

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
            await doc.save();
            await reply.save();

            res.redirect('/b/' + board + '/');

        })
        .get(async (req, res) => {
            let board = req.params.board;
            let thread_id = req.query.thread_id;

            let data = await Message.findOne({
                board: board,
                _id: thread_id
            }).populate('replies');

            if(data == null){
                res.send({});
                return;
            }

            let dataCopy = data.toObject();
            delete dataCopy.reported;
            delete dataCopy.delete_password;
            dataCopy.replies = dataCopy.replies.map(d => {
                delete d.reported;
                delete d.delete_password;
                return d;
            });
            res.send(dataCopy);
        })
        .delete(async (req, res) => {
            let {
                board,
                thread_id,
                reply_id,
                delete_password
            } = req.body;

            try{
                thread_id = mongoose.Types.ObjectId(thread_id);
                let doc = await Message.findOne({
                    _id: thread_id,
                    board: board
                });
                if(doc == null){
                    res.send('Thread not found');
                    return;
                }

                if(doc.replies.indexOf(reply_id) !== -1 && doc !== null){
                    let repdoc = await Reply.findOne({_id: reply_id});

                    if(repdoc == null){
                        res.send('Reply not found');
                        return;
                    }

                    if(repdoc.delete_password === delete_password){
                        repdoc.text = '[deleted]';
                        await repdoc.save();
                        res.send('success');
                    }
                    else
                        res.send('incorrect password');
                }
                else
                    res.send('well well well');
            }
            catch (error){
                res.send('Invalid thread_id');
            }
        })
        .put(async (req, res) => {
            let {
                board,
                thread_id,
                reply_id,
                delete_password
            } = req.body;

            try{
                thread_id = mongoose.Types.ObjectId(thread_id);
                let doc = await Message.findOne({
                    _id: thread_id,
                    board: board
                });

                if(doc == null){
                    res.send('Thread not found');
                    return;
                }

                if(doc.replies.indexOf(reply_id) !== -1 && doc !== null){
                    let repdoc = await Reply.findOne({_id: reply_id});

                    if(repdoc == null){
                        res.send('Reply not found');
                        return;
                    }

                    repdoc.reported = true;
                    await repdoc.save();
                    res.send('success');
                }
                else
                    res.send('well well well');

            }
            catch (error){
                res.send('invalid id');
            }
        });
};
