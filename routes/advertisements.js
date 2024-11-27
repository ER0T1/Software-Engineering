const express = require('express');
const cookieParser = require('cookie-parser');
const app = express.Router();

app.use(cookieParser('secretingredient'));

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

app.use((req, res, next) => {
    if (req.signedCookies.flash) {
        res.locals.flash = req.signedCookies.flash; // 傳遞到模板的變數
        res.clearCookie('flash'); // 清除 Flash Cookie，避免重複顯示
    } else {
        res.locals.flash = null;
    }
    next();
});

app.get(['/', '/index'], function (req, res) {
    res.render('advertisements/index');
});

app.post('/launch', function (req, res) {
    let SQL = "INSERT INTO Advertisements (title, description, userID) VALUES (?, ?, ?)";
    let parms = [req.body.title, req.body.description, req.signedCookies.userID];
    doSQL(SQL, parms, res, function () {
        res.cookie('flash', "Your advertisement has been launched!", { signed: true, maxAge: 10000 });
        res.redirect('/advertisements/');
    });
});

app.get('/manage', function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const offset = (page - 1) * limit;

    let SQL = "SELECT * FROM Advertisements ORDER BY advertisementID LIMIT ? OFFSET ?";

    doSQL(SQL, [limit.toString(), offset.toString()], res, function (data) {
        res.render('advertisements/manage', {
            data: data,
            page: page,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: data.length === limit ? page + 1 : null,
            partials: { row: 'advertisements/row' },
        });
    });
});

app.delete('/:advertisementID', function (req, res) {
    let SQL = "DELETE FROM Advertisements WHERE advertisementID = ?";
    doSQL(SQL, [req.params.advertisementID], res, function () {
        res.send("");
    });
});

app.get('/search', function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const offset = (page - 1) * limit;
    const keyword = "%" + (req.query.keyword || "") + "%";

    let SQL = "SELECT * FROM Advertisements WHERE title LIKE ? OR description LIKE ? ORDER BY advertisementID LIMIT ? OFFSET ?";

    doSQL(SQL, [keyword, keyword, limit.toString(), offset.toString()], res, function (data) {
        res.render('advertisements/list', {
            data: data,
            page: page,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: data.length === limit ? page + 1 : null,
            keyword: req.query.keyword || "",
            partials: { row: 'advertisements/row' },
        });
    });
});

app.get('/:advertisementID', function (req, res) {
    let SQL = "SELECT * FROM Advertisements WHERE advertisementID = ?";
    doSQL(SQL, [req.params.advertisementID], res, function (data) {
        res.render('advertisements/detail', {
            advertisementID: data[0].advertisementID,
            title: data[0].title,
            description: data[0].description,
            created_at: data[0].created_at,
        });
    });
});

app.get('/detail/:advertisementID', function (req, res) {
    const { advertisementID } = req.params;
    const field = req.query.field || "title";

    let SQL = `SELECT ${field} FROM Advertisements WHERE advertisementID = ?`;
    doSQL(SQL, [advertisementID], res, function (data) {
        res.render('advertisements/edit', {
            advertisementID: advertisementID,
            [field]: data[0][field],
        });
    });
});

app.put('/detail/:advertisementID', function (req, res) {
    const { advertisementID } = req.params;
    const title = req.body.title || null;
    const description = req.body.description || null;

    let showTable = function () {

        if (title !== null) {
            let SQL = "SELECT title FROM Advertisements WHERE advertisementID = ?";
            doSQL(SQL, [advertisementID], res, function (data) {
                res.render('advertisements/detailRow', {
                    advertisementID: advertisementID,
                    title: data[0].title,
                });
            });
        }
        if (description !== null) {
            let SQL = "SELECT description FROM Advertisements WHERE advertisementID = ?";
            doSQL(SQL, [advertisementID], res, function (data) {
                res.render('advertisements/detailRow', {
                    advertisementID: advertisementID,
                    description: data[0].description,
                });
            });
        }
    }

    if (req.body.action === "update") {
        let SQL = "UPDATE Advertisements SET "
        let parms = [];

        if (title !== null) {
            SQL += "title = ? ";
            parms.push(title);
        }
        if (description !== null) {
            SQL += "description = ? ";
            parms.push(description);
        }

        SQL += "WHERE advertisementID = ?";
        parms.push(advertisementID);

        doSQL(SQL, parms, res, function (data) {
            showTable();
        });
    }
    else {
        showTable();
    }
});

module.exports = app;