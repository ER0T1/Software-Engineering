下載下來後需要在CMD中先執行下列程式碼:  
  cd `此資料夾的父資料夾`  
  docker run -it --name Company -p 8081:80 -v .\Company:/app bitnami/node bash  
  npm i express hjs mysql2 cookie-parser  
  npm i -g nodemon  
  touch app.js  
  nodemon -L app.js  
- Company是此資料夾原始名稱，你可以修改成你喜歡的名稱。  
  
After downloading, you need to execute the following code in CMD:  
  cd `The parent folder of this folder`  
  npm i express hjs mysql2 cookie-parser  
  npm i -g nodemon  
  touch app.js  
  nodemon -L app.js  
- Company is the original name of this folder, you can change it to a name you like.
