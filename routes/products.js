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

app.get("/categorySearch", function (req, res) {
    let SQL = "SELECT categoryID, description FROM Categories";
    doSQL(SQL, [], res, function (data) {
        res.render('products/categorySearch', {
            categories: data,
        });
    });
});

app.get("/searchResult", function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const offset = (page - 1) * limit;
    const categoryID = req.query.categoryID || null;
    const keyword = "%" + (req.query.keyword || "") + "%";
    let parms = [];

    let SQL = "SELECT productID, title, price FROM Products WHERE ";

    if (categoryID !== null) {
        SQL += "categoryID = ? ";
        parms.push(categoryID.toString());
    }

    SQL += (parms.length > 0 ? "AND " : "") + "title LIKE ? ";
    parms.push(keyword);

    SQL += "ORDER BY productID LIMIT ? OFFSET ?";
    parms.push(limit.toString());
    parms.push(offset.toString());

    doSQL(SQL, parms, res, function (data) {
        res.render('products/list', {
            products: data,
            page: page,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: data.length === limit ? page + 1 : null,
            keyword: req.query.keyword || "",
            partials: { row: 'products/row' },
        });
    });
});

app.get("/ownerSearch", function (req, res) {
    res.render('products/ownerSearch');
});

app.get(['/transactions', '/transactions/:productID'], function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;
    const productID = req.query.productID || req.params.productID || null;
    const ownerName = "%" + (req.query.ownerName || "") + "%";
    let parms = [];

    let SQL = `
        SELECT 
            t.transactionID, p.title, c.description, u.firstName, u.lastName, u.email,
            p.location, p.country, p.payment, t.price, t.status
        FROM 
            Transactions t
        JOIN 
            Products p ON t.productID = p.productID
        JOIN 
            Categories c ON p.categoryID = c.categoryID
        JOIN 
            Users u ON t.sellerID = u.userID
        WHERE 
            t.status = 'open'
    `;

    if (productID !== null) {
        SQL += "AND p.productID = ? ";
        parms.push(productID);
    }

    const buildQueryWithOwnerFilter = (callback) => {
        if (ownerName !== "%%") {
            const SQL2 = "SELECT userID FROM Users WHERE firstName LIKE ? OR lastName LIKE ?";
            doSQL(SQL2, [ownerName, ownerName], res, function (data) {
                if (data.length > 0) {
                    SQL += " AND (";
                    const userIDs = data.map(user => {
                        parms.push(user.userID);
                        return "t.sellerID = ?";
                    });
                    SQL += userIDs.join(" OR ");
                    SQL += ")";
                }
                callback();
            });
        } else {
            callback();
        }
    };

    buildQueryWithOwnerFilter(() => {
        SQL += "LIMIT ? OFFSET ?";
        parms.push(limit.toString(), offset.toString());

        doSQL(SQL, parms, res, function (data) {
            res.render('products/transactions', {
                transactions: data,
                page: page,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: data.length === limit ? page + 1 : null,
                ownerName: req.query.ownerName || "",
                productID: req.query.productID || "",
                partials: { transactionRow: 'products/transactionRow' },
            });
        });
    });
});

module.exports = app;