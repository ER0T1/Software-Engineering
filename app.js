const express = require('express');                 // Import express 框架
const db = require('mysql2');                       // Import mysql2 資料庫連接
const cookieParser = require('cookie-parser');      // Import cookie-parser 模組

const app = express();
app.set("view engine", "hjs");                      // 使用 hjs 模板引擎
app.use(express.urlencoded({ extended: true }));    // 解析 URL 編碼的主體，使用 urlencoded 中介軟體來處理表單資料
app.use(express.static("public"));
app.use(cookieParser('secretingredient'));

const configs = require("./config");
const connection = db.createConnection(configs.db); // 創建資料庫連接

connection.connect((err) => {
    if (err) {
        console.log("Error connecting to database: ", err);
        process.exit();
    }
    else {
        console.log("Connected to database");
    }
});
// 這裡我們將連接到我們的資料庫。如果連接成功，我們將在終端機中看到 Connected to database 的資訊。
// 否則，我們將看到一條錯誤資訊 Error connecting to database: 並退出應用程式。

app.get('/', (req, res) => {
    // 解決主頁嵌套問題。
    // 如果 / 的 HTTP GET 請求是從 HTMX 發送的(HX-Request: 請求源自受 hx-boost 或 hx-get、hx-post 等屬性影響的元素)，
    // 我們將回傳一個 HTML 片段，其中包含一個大的杯子圖示(部分頁面刷新)。
    // 否則我們將使用佈局模板(layout.hjs)來呈現回應(整個頁面刷新)。
    if (req.get("HX-Request")) {
        res.send(
            '<div class="text-center">' +
            '<i class="bi bi-layout-wtf" style="font-size: 50vh;"></i>' +
            '</div>'
        );
    }
    else {
        res.render('layout', {
            title: 'Construction Vechicles & Services',
            partials: {
                navbar: 'navbar',
            }
        });
    }
});
// 我們在 HTTP GET 方法上準備預設路由 /，這稱為主頁。
// 主頁將使用「佈局」範本來呈現回應，該範本有一個命名的空白「標題」需要填充，
// 我們將用「Welcome to McDonald e-management」來填充它。

app.get('/*', function (req, res, next) {
    if (req.get("HX-Request")) {
        next();
    }
    else {
        res.render('layout', {
            title: 'Construction Vechicles & Services',
            partials: {
                navbar: 'navbar',
            },
            where: req.url,
        });
    }
});
// 如果我們現在點擊瀏覽器的重新載入按鈕，它只顯示「[選單項目]頁面」，沒有橫幅、導覽列、頁腳等。
// 這是因為請求沒有匹配 / 路由，直接到 categories 路由並匹配 /categories/，結果會從該路由回傳。
// 使用 /* 萬用路由，我們可以捕獲所有的路由，並在這裡處理它們。
// 如果 HTTP GET 請求在 / 後有某些內容（這就是萬用字符 * 的含義，* 可以是任何字符串），它將匹配新路由。
// 如果請求是從 HTMX 發送的，我們將使用 next() 來繼續處理，否則它將使用附加參數「where」渲染主佈局，該參數是請求中 / 後面的任意字串。

// 這裡我們將所有路由模組化，並將資料庫連接傳遞給它們，並連接到我們的應用程式。
const users = require("./routes/users");            // 掛載 users 模組
users.connection = connection;                      // 將資料庫連接傳遞給路由
app.use("/users", users);

const categories = require("./routes/categories");
categories.connection = connection;
app.use("/categories", categories);

app.listen(80, function () {
    console.log(
        "Web server listening on port 80!\n" +
        "Web server is running on http://localhost:8081."
    );
});
