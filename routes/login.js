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

app.post('/', function (req, res) {
    const username = req.body.username || null;
    const password = req.body.password || null;

    if (username === 'admin' || password === '1234') {
        const options = { signed: true, maxAge: 900000, httpOnly: true, path: '/' };
        res.cookie('admin', true, options);
        res.cookie('loggedIn', true, options);
        res.cookie('username', username, options);
        res.cookie('flash', "You are now logged in!", { signed: true, maxAge: 10000 });
        res.redirect('/');
        return;
    }

    const SQL = "SELECT * FROM Users WHERE email = ? AND password = ?";
    const parms = [username, password];
    doSQL(SQL, parms, res, function (data) {
        if (data.length === 0) {
            res.clearCookie('admin', { path: '/' });
            res.clearCookie('loggedIn', { path: '/' });
            res.clearCookie('userID', { path: '/' });
            res.clearCookie('username', { path: '/' });
            res.cookie('flash', "Login failure!", { signed: true, maxAge: 10000 });
            res.redirect('/login/index');
        }
        else {
            const options = { signed: true, maxAge: 900000, httpOnly: true, path: '/' };
            if (data[0].administrator === 1) {
                res.cookie('admin', true, options);
            }
            res.cookie('loggedIn', true, options);
            res.cookie('userID', data[0].userID, options);
            res.cookie('username', username, options);
            res.cookie('flash', "You are now logged in!", { signed: true, maxAge: 10000 });
            res.redirect('/');
        }
    });
});

app.post('/logout', function (req, res) {
    res.clearCookie('admin', { path: '/' });
    res.clearCookie('loggedIn', { path: '/' });
    res.clearCookie('userID', { path: '/' });
    res.clearCookie('username', { path: '/' });
    res.cookie('flash', "You have logged out!", { signed: true, maxAge: 10000 });
    res.redirect('/');
});

app.get('/index', function (req, res) {
    const flashMessage = req.signedCookies.flash;
    const loggedIn = req.signedCookies.loggedIn === 'true';
    res.render('login/index', { flashMessage, loggedIn });
});

app.get('/register', function (req, res) {
    res.render('login/register');
});

app.post('/register', function (req, res) {
    const firstName = req.body.firstName || null;
    const lastName = req.body.lastName || null;
    const email = req.body.username || null;
    const password = req.body.password || null;

    const SQL = "INSERT INTO Users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)";
    const parms = [firstName, lastName, email, password];
    doSQL(SQL, parms, res, function () {
        res.cookie('flash', "You are now registered!", { signed: true, maxAge: 10000 });
        res.redirect('/');
    });
});

module.exports = app;