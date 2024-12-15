const config = {
    db: {
        host: "mysql",
        user: process.env.MYSQL_USER || "",
        password: process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQL_DATABASE || "",
        connectTimeout: 60000,
        multipleStatements: false,
    },
};
module.exports = config;
// 創建一個 config.js 檔案來存儲有關我們的 DBMS 的配置資訊。請注意，此資訊應與我們用於準備 DBMS 的資訊一致。