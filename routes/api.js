'use strict';

const mongoose = require('mongoose');
const uri = process.env.DB;

module.exports = function(app) {

    mongoose.connect(process.env.DB);
    const Message = mongoose.model('Message', {
        text: String,
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

    app.route('/api/threads/:board')
        .post((req, res) => {
            const {text, delete_password, thread_id} = req.body;
            if (thread_id){
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
                });
            }
            else{
                const newMessage = new Message({
                    text: text,
                    created_on: new Date(),
                    bumped_on: new Date(),
                    reported: false,
                    delete_password: delete_password
                });
                newMessage.save();
            }
        });

    app.route('/api/replies/:board');

};
