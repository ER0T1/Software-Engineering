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

// 使用資料庫連接來查詢準備好的 DBMS 並透過替換 app.get(‘/’, ... ) 路由的內容來顯示結果。
app.get('/', function (req, res) {
    let SQL = "SELECT categoryID, description FROM Categories ORDER BY description";
    doSQL(SQL, [], res, function (data) {
        res.render('categories/index', {
            data: data,
            partials: { row: 'categories/row' },    // 使用 row.hjs 這個 partials 模板
        });
    });
});

// 插入新的 category 資料
app.post("/", function (req, res) {
    let SQL = "INSERT INTO Categories (description) VALUES (?)";
    doSQL(SQL, [req.body.description], res, function (data) {
        res.render('categories/row', {
            categoryID: data.insertId,
            description: req.body.description,
        });
    });
});

// 刪除 category 資料
app.delete("/:categoryID", function (req, res) {
    let SQL = "DELETE FROM Categories WHERE categoryID = ?";
    doSQL(SQL, [req.params.categoryID], res, function (data) {
        res.send("");
    });
});

// 獲取 category 資料，並進入編輯模式
app.get("/:categoryID", function (req, res) {
    let SQL = "SELECT description FROM Categories WHERE categoryID = ?";
    doSQL(SQL, [req.params.categoryID], res, function (data) {
        res.send('categories/edit', {
            categoryID: req.params.categoryID,
            description: data[0].description,
        });
    });
});

// 更新 category 資料
app.put("/:categoryID", function (req, res) {
    let showRow = function() {
        let SQL = "SELECT categoryID, description FROM Categories WHERE categoryID = ?";
        doSQL(SQL, [req.params.categoryID], res, function (data) {
            res.render('categories/row', {
                categoryID: data[0].categoryID,
                description: data[0].description,
            });
        });
    };
    if( req.body.action == "update" ) {
        let SQL = "UPDATE Categories SET description = ? WHERE categoryID = ?";
        const description = req.body.description;
        const categoryID = req.params.categoryID;
        doSQL(SQL, [description, categoryID], res, function (data) {
            showRow();
        });
    }
    else {
        showRow();
    }
});

module.exports = app;