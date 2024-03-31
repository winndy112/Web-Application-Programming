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

## Function

Dưới đây là một số chức năng chính của website.

## 1. Home page
### 1. New posts

Chức năng này cho phép người dùng (sau khi đăng nhập) có thể thêm bài viết mới với nội dung gồm văn bản, hình ảnh và video. 

### 2. List posts

Ở phần List posts, người dùng có thể thấy được 1 danh sách các bài viết được đăng trên diễn đàn (được sắp xếp theo thời gian đăng bài).
List posts sẽ được biểu diễn dưới dạng cards, gồm ảnh bìa, tiêu đề và 1 phần nội dung. Sau khi bấm vào bài viết thì mình có thể xem đầy đủ nội dung của bài viết. Ngoài ra, người dùng còn có thể lưu bài viết vào mục Favorites hoặc thêm bình luận.

### 3. Lastest Update

Phần này hiển thị các hoạt động gần nhất của người dùng, chẳng hạn như các bài viết được bình luận, lưu gần nhất, để người dùng có thể truy cập lại vào các mục gần nhất một cách nhanh chóng.

### 4. Find posts

Người dùng có thể tìm kiếm các bài viết bằng từ khóa. Các từ khóa này có thể là topic của bài viết, tên người dùng.

## 2. Favorites
### 1. 