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

app.delete("/:productID", function (req, res) {
    const productID = req.params.productID;
    const SQL = "DELETE FROM Products WHERE productID = ?";
    doSQL(SQL, [productID], res, function () {
        res.send("");
    });
});

app.get("/ownerSearch", function (req, res) {
    res.render('products/ownerSearch');
});

app.get("/priceSearch", function (req, res) {
    res.render('products/priceSearch');
});

app.get("/keywordSearch", function (req, res) {
    res.render('products/keywordSearch');
});

app.get("/searchResult", function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const offset = (page - 1) * limit;
    const categoryID = req.query.categoryID || null;
    const keyword = "%" + (req.query.keyword || "") + "%";
    const productIsOpenOnly = req.query.productIsOpenOnly || false;
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
            admin: req.signedCookies.admin === 'true',
            products: data,
            page: page,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: data.length === limit ? page + 1 : null,
            keyword: req.query.keyword || "",
            productIsOpenOnly: productIsOpenOnly,
            partials: { row: 'products/row' },
        });
    });
});

app.get(['/transactions', '/transactions/:productID'], function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;
    const productID = req.query.productID || req.params.productID || null;
    const ownerName = "%" + (req.query.ownerName || "") + "%";
    const maxPrice = req.query.maxPrice || null;
    const minPrice = req.query.minPrice || null;
    const keyword = "%" + (req.query.keyword || "") + "%";
    const productIsOpenOnly = req.query.productIsOpenOnly || false;
    let parms = [];

    let SQL = `
        SELECT 
            t.transactionID, p.title, c.description, u.firstName, u.lastName, u.email,
            p.location, p.country, p.payment, t.price, t.status, t.sellerID, t.buyerID
        FROM 
            Transactions t
        JOIN 
            Products p ON t.productID = p.productID
        JOIN 
            Categories c ON p.categoryID = c.categoryID
        JOIN 
            Users u ON t.sellerID = u.userID
        WHERE 
    `;

    if (productIsOpenOnly === "true") {
        SQL += "t.status = 'open' ";
    }
    else {
        SQL += "(t.status = 'open' OR t.status = 'close') ";
    }

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

        if (maxPrice !== null) {
            SQL += "AND t.price <= ? ";
            parms.push(maxPrice.toString());
        }
    
        if (minPrice !== null) {
            SQL += "AND t.price >= ? ";
            parms.push(minPrice.toString());
        }

        SQL += "LIMIT ? OFFSET ?";
        parms.push(limit.toString(), offset.toString());

        doSQL(SQL, parms, res, function (data) {
            res.render('products/transactions', {
                editable: (req.signedCookies.admin === 'true') || (req.signedCookies.userID === data[0].sellerID),
                transactions: data,
                page: page,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: data.length === limit ? page + 1 : null,
                ownerName: req.query.ownerName || null,
                productID: req.query.productID  || null,
                maxPrice: req.query.maxPrice || null,
                minPrice: req.query.minPrice || null,
                partials: { transactionRow: 'products/transactionRow' },
            });
        });
    });
});

app.delete("/delete/:transactionID", function (req, res) {
    const transactionID = req.params.transactionID;
    const SQL = "DELETE FROM Transactions WHERE transactionID = ?";
    doSQL(SQL, [transactionID], res, function () {
        res.send("");
    });
});

app.get("/edit/:transactionID", function (req, res) {
    const transactionID = req.params.transactionID;
    const SQL = `
        SELECT 
            t.transactionID, p.title,c.categoryID, c.description, u.firstName, u.lastName, u.email,
            p.condition, p.location, p.country, p.payment, t.price, t.status, t.sellerID, t.buyerID
        FROM 
            Transactions t
        JOIN 
            Products p ON t.productID = p.productID
        JOIN 
            Categories c ON p.categoryID = c.categoryID
        JOIN 
            Users u ON t.sellerID = u.userID
        WHERE 
            t.transactionID = ?
    `;

    const SQL2 = "SELECT * FROM Categories";

    doSQL(SQL, [transactionID], res, function (data) {
        doSQL(SQL2, [], res, function (categories) {
            let condition = "condition" + data[0].condition.toString();
            let payment = data[0].payment.toString();
            let updatedCategories = categories.map(category => {
                return {
                    categoryID: category.categoryID,
                    description: category.description,
                    selected: category.categoryID === data[0].categoryID ? "selected" : "",
                };
            });
            res.render('products/transactionEdit', {
                transactionID: data[0].transactionID,
                title: data[0].title,
                currentCategoryID: data[0].categoryID,
                categories: updatedCategories,
                [condition]: condition,
                location: data[0].location,
                country: data[0].country,
                [payment]: payment,
                price: data[0].price,
                isSelected: function (value, currentValue) {
                    return value === currentValue ? "selected" : "";
                },
            });
        });
    });
});

app.post("/transactionEdit/:transactionID", function (req, res) {
    const { transactionID } = req.params;
    const { title, categoryID, condition, location, country, payment, price } = req.body;

    let SQL = `
        UPDATE Products 
        SET title = ?, categoryID = ?, \`condition\` = ?, location = ?, country = ?, payment = ?
        WHERE productID = (SELECT productID FROM Transactions WHERE transactionID = ?)
    `;
    
    let SQL2 = "UPDATE Transactions SET price = ? WHERE transactionID = ?";

    let parms = [title, categoryID, condition, location, country, payment, transactionID];
    doSQL(SQL, parms, res, function () {
        doSQL(SQL2, [price, transactionID], res, function () {
            res.redirect(`/products/detail/${transactionID}`);
        });
    });
});

app.get("/detail/:transactionID", function (req, res) {
    const transactionID = req.params.transactionID;
    const SQL = `
        SELECT 
            t.transactionID, p.title, c.description, u.firstName, u.lastName, u.email,
            p.condition, p.location, p.country, p.payment, t.price, t.status, t.sellerID, t.buyerID
        FROM 
            Transactions t
        JOIN 
            Products p ON t.productID = p.productID
        JOIN 
            Categories c ON p.categoryID = c.categoryID
        JOIN 
            Users u ON t.sellerID = u.userID
        WHERE 
            t.transactionID = ?
    `;

    const SQL2 = `
        SELECT 
            r.rating, r.comment, r.created_at
        FROM 
            Ratings r
        WHERE 
            r.transactionID = ?
    `;

    doSQL(SQL, [transactionID], res, function (data) {
        doSQL(SQL2, [transactionID], res, function (ratings) {
            res.render('products/transactionDetail', {
                canConsume: (req.signedCookies.loggedIn === 'true') && (data[0].status === 'open'),
                editable: (req.signedCookies.admin === 'true') || (req.signedCookies.userID === data[0].sellerID),
                canComment: (data[0].buyerID === null ? false : data[0].buyerID == req.signedCookies.userID),
                title: data[0].title,
                transactionID: data[0].transactionID,
                description: data[0].description,
                condition: data[0].condition,
                seller: data[0].firstName + " " + data[0].lastName,
                email: data[0].email,
                payment: data[0].payment,
                price: data[0].price,
                location: data[0].location,
                country: data[0].country,
                status: data[0].status,
                ratings: ratings,
            });
        });
    });
});

app.post("/rate/:transactionID", function (req, res) {
    const transactionID = req.params.transactionID;
    const rating = req.body.rating || null;
    const comment = req.body.comment || null;

    let SQL = "SELECT sellerID FROM Transactions WHERE transactionID = ?";
    doSQL(SQL, [transactionID], res, function (data) {
        let SQL2 = "SELECT * FROM Ratings WHERE transactionID = ?";
        doSQL(SQL2, [transactionID], res, function (data2) {
            const sellerID = data[0].sellerID;
            const buyerID = req.signedCookies.userID;
            let SQL3 = "INSERT INTO Ratings (transactionID, sellerID, buyerID, rating, comment) VALUES (?, ?, ?, ?, ?)";
            let parms = [transactionID, sellerID, buyerID, rating, comment];
            if (data2.length > 0) {
                SQL3 = "UPDATE Ratings SET rating = ?, comment = ? WHERE transactionID = ?";
                parms = [rating, comment, transactionID];
            }
            doSQL(SQL3, parms, res, function () {
                res.redirect('/products/detail/' + transactionID);
            });
        });
    });
});

app.get('/buy/:transactionID', function (req, res) {
    const { transactionID } = req.params;

    const SQL = `
        SELECT 
            t.transactionID, p.title, c.description, u.firstName, u.lastName, u.email,
            p.condition, p.location, p.country, p.payment, t.price, t.status, t.sellerID, t.buyerID
        FROM 
            Transactions t
        JOIN 
            Products p ON t.productID = p.productID
        JOIN 
            Categories c ON p.categoryID = c.categoryID
        JOIN 
            Users u ON t.sellerID = u.userID
        WHERE 
            t.transactionID = ?
    `;

    doSQL(SQL, [transactionID], res, function (data) {
        res.render('products/buyConfirmation', {
            [req.query.consume]: req.query.consume,
            transactionID: data[0].transactionID,
            title: data[0].title,
            description: data[0].description,
            condition: data[0].condition,
            seller: data[0].firstName + " " + data[0].lastName,
            email: data[0].email,
            location: data[0].location,
            country: data[0].country,
            payment: data[0].payment,
            price: data[0].price,
        });
    });
});

app.get('/drivers', function (req, res) {
    const transactionID = req.query.transactionID;

    if (!transactionID) {
        return res.status(400).send('Transaction ID is required');
    }

    let categorySQL = `
        SELECT Products.categoryID 
        FROM Transactions 
        JOIN Products ON Transactions.productID = Products.productID 
        WHERE Transactions.transactionID = ?
    `;

    doSQL(categorySQL, [transactionID], res, function (categoryData) {
        if (categoryData.length === 0) {
            return res.status(404).send('Transaction or category not found');
        }

        const categoryID = categoryData[0].categoryID;

        let driversSQL = `
            SELECT Users.userID, Users.firstName, Users.lastName 
            FROM Users 
            WHERE Users.driver = ?
        `;

        doSQL(driversSQL, [categoryID], res, function (driverData) {
            if (driverData.length > 0) {
                const options = driverData.map(driver => 
                    `<option value="${driver.userID}">${driver.firstName} ${driver.lastName}</option>`
                ).join('');
                
                res.send(`
                    <div class="form-group">
                        <label for="driver">Select Driver</label>
                        <select class="form-control" id="driver" name="driver" required>
                            ${options}
                        </select>
                    </div>
                `);
            } else {
                res.send('<p>No drivers available for this category</p>');
            }
        });
    });
});

app.post('/buy/:transactionID', function (req, res) {
    const { transactionID } = req.params;
    const buyerID  = req.signedCookies.userID;
    let { needDriver, driver } = req.body;

    if (!driver) {
        driver = null;
    }

    let SQL = `
        UPDATE Transactions 
        SET buyerID = ?, driverID = ?, status = 'close' 
        WHERE transactionID = ?
    `;
    let SQL2 = "SELECT driverID FROM Drivers WHERE userID = ?";

    let transaction = function (driverID) {
        let parms = [buyerID, driverID, transactionID];
        doSQL(SQL, parms, res, function () {
            res.redirect(`/products/detail/${transactionID}`);
        });
    };

    if (needDriver) {
        doSQL(SQL2, [driver], res, function (data) {
            transaction(data[0].driverID);
        });
    }
    else {
        transaction(null);
    }
});

module.exports = app;