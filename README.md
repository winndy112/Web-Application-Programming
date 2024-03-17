# Web Application Programming
Project of NT208

# Setup ExpressJS
1. Tải NodeJS ở link này: https://nodejs.org/en/download. (hiện tại t cài bản node-v20.11.1-x64.msi)
2. Trong terminal vscode, chạy lệnh:
```
npm init -y
npm i express
npm i --save-dev nodemon
```
3. Sửa file ```package.json``` thành:
```
{
  "name": "handmade-forum",
  "version": "1.0.0",
  "description": "Project of NT208",
  "main": "index.js",
  "scripts": {
    "devStart": "nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```
4. Cài extension EJS trong vscode. Sau đó chạy lệnh:
```
npm i ejs
```
5. Chạy code bằng lệnh:
```
npm run devStart
```

## Note

hiuhiu
