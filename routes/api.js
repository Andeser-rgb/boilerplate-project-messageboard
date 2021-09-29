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
        replies: [{
            _id: mongoose.ObjectId,
            text: String,
            created_on: Date,
            delete_password: String,
            reported: Boolean
        }]
    });

    const Message = mongoose.model('Messageboard', MessageSchema);


    app.route('/api/threads/:board')
        .post((req, res) => {
            const {
                board,
                text,
                delete_password
            } = req.body;

            const newMessage = new Message({
                text: text,
                board: board,
                created_on: new Date(),
                bumped_on: new Date(),
                reported: false,
                delete_password: delete_password
            });
            newMessage.save();
            res.redirect('/b/' + board);
        });

    app.route('/api/replies/:board')
      .post((req, res) => {
            const {
                board,
                text,
                delete_password,
                thread_id
            } = req.body;

            Message.findByIdAndUpdate(thread_id, (err, doc) => {
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
