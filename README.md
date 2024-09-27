# Web Application Programming
Project of NT208

Link truy cập: kheotayhaylam.azurewebsites.net

# Function
Dưới đây là một số chức năng chính của website.

## 1. Intro Page
### 1. About us
Hiển thị phần giới thiệu website.
### 2. Sign up
Chức năng: Đăng kí tài khoản mới (Không có đăng kí bằng Gmail)
### 3. Sign in 
Chức năng: Đăng nhập tài khoản bằng **username** và **password**.

Nếu người dùng quên mật khẩu thì có thể sử dụng chức năng **Forgot password?**. Link để reset password sẽ được gửi về mail đã đăng kí.

## 2. Home page
Trang này chỉ có thể vào khi người dùng đã đăng nhập.
### 1. Create posts
Chức năng này cho phép người dùng (sau khi đăng nhập) có thể thêm bài viết mới với nội dung gồm văn bản, hình ảnh hoặc video. 
### 2. Display posts
Ở phần Display posts, người dùng có thể thấy được 1 danh sách các bài viết được đăng trên diễn đàn (được sắp xếp theo thời gian đăng bài).

Mỗi bài viết sẽ được biểu diễn dưới dạng cards, gồm ảnh bìa, tiêu đề và 1 phần nội dung. 

>- Sau khi bấm vào bài viết thì mình có thể xem đầy đủ nội dung của bài viết. Người dùng còn có thể **lưu bài viết vào mục Favorites** hoặc **thêm bình luận**. 
>- Các bài viết có thể truy cập mà không cần phải đăng nhập. Tuy nhiên người dùng không đăng nhập thì không thể thêm bình luận hoặc thích.

### 3. Lastest Update

Hiển thị các **hoạt động gần nhất** của người dùng, chẳng hạn như các bài viết được tạo, bình luận, lưu gần nhất, để người dùng có thể truy cập lại vào các mục gần nhất một cách nhanh chóng.

### 4. Search / Filter posts
>- **Search:** Người dùng có thể tìm kiếm các bài viết bằng từ khóa. Các từ khóa này có thể là topic của bài viết, tên người dùng.
>- **Filter:** Người dùng có thể lọc bài viết theo các chủ đề hoặc thời gian tạo bài viết. 

## 3. Favorites
Chức năng: Hiển thị các bài viết đã được thêm vào yêu thích.

## 4. Contact Us
Chức năng: Gửi đóng góp đến admin

## 5. Profile
>- **Cập nhật thông tin tài khoản:**
>- Avatar
>- Name
>- Email
>- Phone number
>- Password
>- **Xem thông báo**
>- Hiển thị các thông báo như ai đã thích, bình luận bài viết của bạn
>- **Xem, xóa và chỉnh bài viết người dùng đã đăng**
>- **Đăng xuất tài khoản**


# Setup ExpressJS
1. Tải NodeJS ở link này: https://nodejs.org/en/download. (hiện tại cài bản node-v20.11.1-x64.msi)
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


###
Cài Redis Insight
https://www.youtube.com/watch?v=bkSdxT1Vk4s


