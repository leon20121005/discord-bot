const connectionPool = require('./db.js')

const Action = function(action) {
    this.id = action.id;
    this.user_id = action.user_id;
    this.command = action.command;
    this.video_id = action.video_id;
    this.created_at = action.created_at;
}

Action.create = (action, callback) => {
    connectionPool.getConnection((error, connection) => {
        if (error) {
            console.error(error);
        } else {
            connection.query('insert into ACTIONS set ?', action, (error, result) => {
                if (error) {
                    console.error(error);
                    callback(error, null);
                } else {
                    callback(null, { id: result.insertId, ...action });
                    connection.release();
                }
            });
        }
    });
}

module.exports = Action;
