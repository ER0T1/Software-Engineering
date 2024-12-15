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

app.get("/existingProduct", function (req, res) {
    let SQL = "SELECT categoryID, description FROM Categories";
    doSQL(SQL, [], res, function (data) {
        res.render('launch/ExistingProduct', {
            categories: data,
        });
    });
});

app.get('/newProduct', function (req, res) {
    const sellerID = req.session.userID;
    let SQL = "SELECT categoryID, description FROM Categories";
    let SQL2 = "SELECT firstName, lastName, email FROM Users WHERE userID = ?";
    doSQL(SQL, [], res, function (data) {
        doSQL(SQL2, [sellerID], res, function (seller) {
            res.render('launch/launch', {
                new: true,
                categories: data,
                seller: seller[0].firstName + " " + seller[0].lastName,
                email: seller[0].email,
            });
        });
    });
});

app.get('/searchExistingProduct', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const offset = (page - 1) * limit;
    const categoryID = req.query.categoryID || null;
    const keyword = "%" + (req.query.keyword || "") + "%";
    let SQL = "SELECT productID, title FROM Products WHERE ";
    let parms = [];

    if (categoryID) {
        SQL += "categoryID = ? AND ";
        parms.push(categoryID);
    }

    SQL += "title LIKE ? LIMIT ? OFFSET ?";
    parms.push(keyword, limit.toString(), offset.toString());

    doSQL(SQL, parms, res, function (data) {
        res.render('launch/list', {
            products: data,
            page: page,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: data.length === limit ? page + 1 : null,
            keyword: req.query.keyword || "",
            categoryID: req.query.categoryID || "",
            partials: { row: 'launch/row' },
        });
    });
});

app.get('/launchExistingProduct/:productID', function (req, res) {
    const productID = req.params.productID;
    const sellerID = req.session.userID;
    let SQL = "SELECT * FROM Products WHERE productID = ?";
    let SQL2 = "SELECT firstName, lastName, email FROM Users WHERE userID = ?";
    let SQL3 = "SELECT categoryID, description FROM Categories WHERE categoryID = ?";

    doSQL(SQL, [productID], res, function (product) {
        doSQL(SQL2, [sellerID], res, function (seller) {
            doSQL(SQL3, [product[0].categoryID], res, function (category) {
                res.render('launch/launch', {
                    existing: true,
                    productID: productID,
                    title: product[0].title,
                    description: category[0].description,
                    condition: product[0].condition,
                    seller: seller[0].firstName + " " + seller[0].lastName,
                    email: seller[0].email,
                    location: product[0].location,
                    country: product[0].country,
                    payment: product[0].payment,
                    price: product[0].price,
                });
            });
        });
    });
});

app.post('/launch', function (req, res) {
    const product = req.query.product;

    if (product === "existing") {
        const productID = req.query.productID;
        const sellerID = req.session.userID;
        const price = req.body.price;
        let SQL = "INSERT INTO Transactions (productID, sellerID, price) VALUES (?, ?, ?)";

        doSQL(SQL, [productID, sellerID, price], res, function (data) {
            res.redirect(`/products/detail/${data.insertId}`);
        });
    }
    else if (product === "new") {
        const categoryID = req.body.categoryID;
        const title = req.body.title;
        const condition = req.body.condition;
        const payment = req.body.payment;
        const price = req.body.price;
        const location = req.body.location;
        const country = req.body.country;

        const sellerID = req.session.userID;

        let SQL = "INSERT INTO Products (categoryID, title, \`condition`\, payment, price, location, country) VALUES (?, ?, ?, ?, ?, ?, ?)";
        let SQL2 = "INSERT INTO Transactions (productID, sellerID, price) VALUES (?, ?, ?)";

        doSQL(SQL, [categoryID, title, condition, payment, price, location, country], res, function (data) {
            doSQL(SQL2, [data.insertId, sellerID, price], res, function (data) {
                res.redirect(`/products/detail/${data.insertId}`);
            });
        });
    }
});

module.exports = app;