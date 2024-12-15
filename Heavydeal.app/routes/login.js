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

app.post('/', function (req, res) {
    const username = req.body.username || null;
    const password = req.body.password || null;

    const SQL = "SELECT * FROM Users WHERE email = ? AND password = ?";
    const parms = [username, password];
    doSQL(SQL, parms, res, function (data) {
        if (data.length === 0) {
            req.session.admin = null;
            req.session.loggedIn = null;
            req.session.userID = null;
            req.session.username = null;
            res.cookie('flash', "Login failure!", { signed: true, maxAge: 10000 });
            res.redirect('/login/index');
        }
        else {
            if (data[0].administrator === 1) {
                req.session.admin = true;
            }
            req.session.loggedIn = true;
            req.session.userID = data[0].userID;
            req.session.username = username;
            res.cookie('flash', "You are now logged in!", { signed: true, maxAge: 10000 });
            res.redirect('/');
        }
    });
});

app.post('/logout', function (req, res) {
    req.session.admin = null;
    req.session.loggedIn = null;
    req.session.userID = null;
    req.session.username = null;
    res.cookie('flash', "You have logged out!", { signed: true, maxAge: 10000 });
    res.redirect('/');
});

app.get('/index', function (req, res) {
    const flashMessage = req.session.flash;
    const loggedIn = req.session.loggedIn === 'true';
    res.render('login/index', {
        flashMessage,
        loggedIn,
    });
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
        res.session('flash', "You are now registered!", { signed: true, maxAge: 10000 });
        res.redirect('/');
    });
});

app.post(['/profile', '/profile/:userID'], function (req, res) {
    const userID = req.session.userID || req.params.userID;

    const SQL = "SELECT * FROM Users WHERE userID = ?";
    const SQL2 = `
        SELECT t.transactionID, p.title, c.description, t.status, p.payment, t.price, t.buyerID
        FROM Transactions t 
        JOIN Products p ON t.productID = p.productID 
        JOIN Categories c ON p.categoryID = c.categoryID
        WHERE sellerID = ?
    `;
    const SQL3 = "SELECT description FROM Categories WHERE categoryID = ?";
    const parms = [userID];

    doSQL(SQL, parms, res, function (userData) {
        doSQL(SQL2, parms, res, function (transactionsData) {
            if (userData[0].driver == 0) {
                res.render('login/profile', {
                    userID,
                    firstName: userData[0].firstName,
                    lastName: userData[0].lastName,
                    email: userData[0].email,
                    transactions: transactionsData,
                    partials: { row: 'login/row' },
                });
            }
            else {
                doSQL(SQL3, userData[0].driver, res, function (description) {
                    res.render('login/profile', {
                        userID,
                        firstName: userData[0].firstName,
                        lastName: userData[0].lastName,
                        email: userData[0].email,
                        description: description[0].description,
                        transactions: transactionsData,
                        partials: { row: 'login/row' },
                    });
                });
            }
        });
    });
});

module.exports = app;