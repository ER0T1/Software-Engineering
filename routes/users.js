const express = require('express');
const app = express.Router();

function doSQL(SQL, parms, res, callback) {
    app.connection.execute(SQL, parms, function (err, data) {
        if (err) {
            console.log("Error fetching data: ", err);
            res.status(404).send(err.sqlMessage);
        }
        else {
            callback(data);
        }
    });
}

app.get('/', function (req, res) {
    let SQL = "SELECT userID, firstName, lastName, email FROM Users ORDER BY userID";
    doSQL(SQL, [], res, function (data) {
        res.render('users/index', {
            data: data,
            partials: { row: 'users/row' },
        });
    });
});

app.delete("/:userID", function (req, res) {
    let SQL = "DELETE FROM Users WHERE userID = ?";
    doSQL(SQL, [req.params.userID], res, function (data) {
        res.send("");
    });
});

app.get("/:userID", function (req, res) {
    let SQL = "SELECT firstName, lastName, email, password, created_at FROM Users WHERE userID = ?";
    doSQL(SQL, [req.params.userID], res, function (data) {
        res.render('users/detail', {
            userID: req.params.userID,
            firstName: data[0].firstName,
            lastName: data[0].lastName,
            email: data[0].email,
            password: data[0].password,
            created_at: data[0].created_at,
        });
    });
});

app.get("/detail/:userID", function (req, res) {
    const { userID } = req.params;
    const field = req.query.field || "firstName";
    let SQL = `SELECT ${field} FROM Users WHERE userID = ?`;

    doSQL(SQL, [userID], res, function (data) {
        res.render('users/edit', {
            userID: userID,
            [field]: data[0][field],
        });
    });
});

app.put("/detail/:userID", function (req, res) {
    const { userID } = req.params;
    const firstName = req.body.firstName || null;
    const lastName = req.body.lastName || null;
    const email = req.body.email || null;
    const password = req.body.password || null;

    let showTable = function () {
        let SQL = "SELECT ";
        let editDataName = "";

        if (firstName !== null) {
            SQL += "firstName ";
            editDataName = "firstName";
        }
        if (lastName !== null) {
            SQL += "lastName ";
            editDataName = "lastName";
        }
        if (email !== null) {
            SQL += "email ";
            editDataName = "email";
        }
        if (password !== null) {
            SQL += "password ";
            editDataName = "password";
        }

        SQL += "FROM Users WHERE userID = ?";
        doSQL(SQL, [userID], res, function (data) {
            res.render('users/detailRow', {
                userID: userID,
                editDataName: editDataName,
                editData: data[0][editDataName],
            });
        });
    };

    if (req.body.action === "update") {
        let SQL = "UPDATE Users SET ";
        let parms = [];

        if (firstName !== null) {
            SQL += "firstName = ?";
            parms.push(firstName);
        }
        if (lastName !== null) {
            SQL += "lastName = ?";
            parms.push(lastName);
        }
        if (email !== null) {
            SQL += "email = ?";
            parms.push(email);
        }
        if (password !== null) {
            SQL += "password = ?";
            parms.push(password);
        }

        SQL += " WHERE userID = ?";
        parms.push(userID);

        doSQL(SQL, parms, res, function (data) {
            showTable();
        });
    }
    else {
        showTable();
    }
});

module.exports = app;