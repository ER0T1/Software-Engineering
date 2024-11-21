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

// 顯示所有使用者
app.get('/', function (req, res) {
    const page = parseInt(req.query.page) || 1; // 預設第一頁
    const limit = 100; // 每頁顯示100項
    const offset = (page - 1) * limit;

    let SQL = "SELECT userID, firstName, lastName, email FROM Users ORDER BY userID LIMIT ? OFFSET ?";
    doSQL(SQL, [limit.toString(), offset.toString()], res, function (data) {
        res.render('users/index', {
            data: data,
            page: page,
            prevPage: page > 1 ? page - 1 : null, // 如果不是第一頁，顯示上一頁按鈕
            nextPage: data.length === limit ? page + 1 : null, // 如果有足夠資料，顯示下一頁按鈕
            partials: { row: 'users/row' },
        });
    });
});

// 刪除使用者
app.delete("/:userID", function (req, res) {
    let SQL = "DELETE FROM Users WHERE userID = ?";
    doSQL(SQL, [req.params.userID], res, function (data) {
        res.send("");
    });
});

// 搜尋使用者
app.get("/search", function (req, res) {
    const page = parseInt(req.query.page) || 1; // 預設第一頁
    const limit = 100; // 每頁顯示100項
    const offset = (page - 1) * limit;
    const keyword = "%" + req.query.keyword + "%";

    let SQL = "SELECT userID, firstName, lastName, email FROM Users ";
    SQL += "WHERE (userID LIKE ? OR firstName LIKE ? OR lastName LIKE ? OR email LIKE ?) ";
    SQL += "ORDER BY userID LIMIT ? OFFSET ?";

    doSQL(SQL, [keyword, keyword, keyword, keyword, limit.toString(), offset.toString()], res, function (data) {
        res.render('users/list', {
            data: data,
            page: page,
            prevPage: page > 1 ? page - 1 : null, // 如果不是第一頁，顯示上一頁按鈕
            nextPage: data.length === limit ? page + 1 : null, // 如果有足夠資料，顯示下一頁按鈕
            keyword: req.query.keyword || "", // 保留搜尋關鍵字
            partials: { row: 'users/row' },
        });
    });
});

// 顯示使用者詳細資料
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

// 進入編輯模式
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

// 使用PUT方法更新資料
app.put("/detail/:userID", function (req, res) {
    const { userID } = req.params;
    const firstName = req.body.firstName || null;
    const lastName = req.body.lastName || null;
    const email = req.body.email || null;
    const password = req.body.password || null;

    let showTable = function () {
        let SQL = "SELECT ";
        let editDataName = "";
        let th = "";

        if (firstName !== null) {
            SQL += "firstName ";
            editDataName = "firstName";
            th = "First Name";
        }
        if (lastName !== null) {
            SQL += "lastName ";
            editDataName = "lastName";
            th = "Last Name";
        }
        if (email !== null) {
            SQL += "email ";
            editDataName = "email";
            th = "E-Mail";
        }
        if (password !== null) {
            SQL += "password ";
            editDataName = "password";
            th = "Password";
        }

        SQL += "FROM Users WHERE userID = ?";
        doSQL(SQL, [userID], res, function (data) {
            res.render('users/detailRow', {
                userID: userID,
                th: th,
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