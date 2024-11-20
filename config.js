const config = {
    db: {
        host: "172.17.0.2",
        user: "Company",
        password: "CompanyPassword",
        database: "Company",
        connectTimeout: 60000
    },
};
module.exports = config;
// 創建一個 config.js 檔案來存儲有關我們的 DBMS 的配置資訊。請注意，此資訊應與我們用於準備 DBMS 的資訊一致。