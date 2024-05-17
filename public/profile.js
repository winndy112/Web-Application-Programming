

// Create event click option
async function getAPI() {
    try {
        const response = await fetch(`/profile/api`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            // console.log(data);
            updateProfileContent(data.user, data.meta);
        } else {
            const errorData = await response.json();
            alert(`Failed to load profile: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading the profile.');
    }
}

function updateProfileContent(user, meta) {
    // Update user details in the sidebar
    if (meta.cover) {
        document.getElementById('avatar-img').src = meta.cover;
    }
    // document.querySelector('.author-card-cover').style.backgroundImage = `url(${user.coverImageUrl || 'https://bootdey.com/img/Content/flores-amarillas-wallpaper.jpeg'})`;
    document.getElementById('username').textContent = user.username;
    document.getElementById('joinedTime').textContent = `Joined ${new Date(meta.createdAt).toLocaleDateString()}`;
    // Update profile form fields
    document.getElementById('account-fn').value = meta.firstname || '';
    document.getElementById('account-ln').value = meta.lastname || '';
    document.getElementById('account-email').value = meta.email || '';
    document.getElementById('account-phone').value = meta.phone || '';
}

function displayNotifications(notifications) {
    const notificationContainer = document.querySelector('.notification-container');
    notificationContainer.innerHTML = `
        <h2 class="text-center">My Notifications</h2>
        <div class="dismiss-all-wrapper" style="display: flex; justify-content: flex-end; width: 100%;">
            <p class="dismiss text-right">
                <button style="border: none; background-color: #dc3545; color: white; border-radius:0.375rem;" id="dismiss-all">Dismiss All</button>
            </p>
        </div>  
    `;
    notifications.forEach(notification => {
        const notificationCard = document.createElement('div');
        notificationCard.classList.add('notification-card');
        notificationCard.classList.add('card');
        notificationCard.innerHTML = `
            <div class="card-body">
                <table>
                    <tr>
                        <td style="width:70%">
                            <div class="card-title` + (notification.isRead ? '' : ' unread') + `">${notification.content} </div>
                        </td>
                        <td style="width:30%">
                        <button style="border: none; background-color: #dc3545; color: white; border-radius:0.375rem;" class="btn btn-danger dismiss-notification">Dismiss</button>
                        </td>
                    </tr>
                </table>
            </div>
        `;
        notificationContainer.appendChild(notificationCard);
    });
}
function addListenerToDismiss() {

const dismissAll = document.getElementById('dismiss-all');
const dismissBtns = Array.from(document.querySelectorAll('.dismiss-notification'));

// nếu click vào dismiss all 
dismissAll.addEventListener('click', async () => {
    try {
        const response = await fetch('/profile/notifications/dismissAll', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        alert(data);
        if (data.result === true) {
            notificationCards.forEach(card => {
                card.remove();
            });
        } else {
            alert('Failed to dismiss all notifications');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while dismissing all notifications.');
    }
});
dismissBtns.forEach((dismissBtn, index) => {
    dismissBtn.addEventListener('click', async () => {
        // Get the corresponding notification card
        const notificationCard = dismissBtn.closest('.notification-card');
        try {
            const response = await fetch(`/profile/notifications/dismiss${index}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.result === true) {
                notificationCard.remove();
            } else {
                alert('Failed to dismiss the notification', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while dismissing the notification.');
        }
    });
});

}
document.addEventListener("DOMContentLoaded", function () {
    // load profile khi trang web được load
    getAPI();

    var accountOption = document.querySelector('.account-option');
    var mypostOption = document.querySelector('.mypost-option');
    // var inboxOption = document.querySelector('.inbox-option');
    var notificationsOption = document.querySelector('.notifications-option');
    var logoutOption = document.querySelector('.logout-option');
    // Get all the content divs
    var accountContent = document.getElementById('my-account-option');
    var mypostContent = document.getElementById('my-post-option');
    // var inboxContent = document.getElementById('inbox');
    var notificationContent = document.getElementById('notification');
    var logoutContent = document.getElementById('log-out');
    var allContent = [accountContent, mypostContent,  notificationContent, logoutContent];
    // SHOW MENU
    function showContent(content) {
        allContent.forEach(function (item) {
            item.style.display = 'none';
        });
        content.style.display = 'block';
    }
    // Add click event listeners to option links
    accountOption.addEventListener('click', function () {
        showContent(accountContent);
    });
    // khi user nhấn vào option notification
    notificationsOption.addEventListener('click', async function () {
        showContent(notificationContent);
        try{
            const response = await fetch('/profile/notifications', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            // console.log("after fetch", data);
            if (data.notifications.length === 0) {
                alert("No notifications");
            } else {
                // Hiển thị trên giao diện
                displayNotifications(data.notifications);
                // add listener cho dismiss all và dismiss từng cái
                addListenerToDismiss();
            }
        }
        catch (error) {
            console.error('Error:', error);
            alert('An error occurred while loading the notifications.');
        }
    });
    
    // khi user nhấn log out option
    logoutOption.addEventListener('click', async function () {
        // Assuming showContent is a function defined somewhere else to show the log-out content
        showContent(logoutContent);
        try {
            const response = await fetch('/profile/logout', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // console.log(response);
                const result = await response.json();
                window.location.href = '/intro'; // Adjust the URL as needed
                alert(result.message);
            } else {
                // console.log(response);
                const errorData = await response.json();
                alert(`Logout failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while logging out.');
        }
    });


    // Xử lý sự kiện khi click vào option my post
    mypostOption.addEventListener('click', function () {
        showContent(mypostContent);
        fetch('/profile/showMyPost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Gửi yêu cầu, không có dữ liệu
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Trả về dữ liệu từ phản hồi dưới dạng JSON
            })
            .then(data => {
                // Xử lý dữ liệu nhận được từ máy chủ
                // console.log(data);
                if (data.data.length === 0) {
                    alert("Người dùng chưa đăng bài post nào");
                } else {
                    // Hiển thị trên giao diện
                    displayUserPosts(data);

                    // Gắn sự kiện edit Post
                }

                // gắn listener event cho các card

            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    });
    // Get references to the button and the menu
    const tagButton = document.getElementById("navbar-toggler");
    const menu = document.getElementById("navbarNav");
    const content = document.getElementById("content");

    // thêm listener để hiện menu khi click vào button
    tagButton.addEventListener("click", function () {
        // Toggle the display of the menu
        if (menu.classList.contains("show")) {
            menu.classList.remove("show");
            content.style.paddingTop = "0px"; // Adjust as needed
        } else {
            menu.classList.add("show");
            content.style.paddingTop = menu.clientHeight + "px";
        }
    });

    // thêm listener để ẩn menu khi click ra ngoài menu
    document.addEventListener("click", function (event) {
        const isClickInsideMenu = menu.contains(event.target);
        const isClickInsideButton = tagButton.contains(event.target);

        if (!isClickInsideMenu && !isClickInsideButton) {
            menu.classList.remove("show");
            content.style.paddingTop = "0px"; // Adjust as needed
        }
    });

    /*-------------------------------------------------------------------------*/
    // khi người dùng muốn update profile
    const btnUpdate = document.getElementById('btnUpdateProfile');
    btnUpdate.addEventListener("click", async function(event) {
        event.preventDefault();
        const requestData = {
            firstName: document.getElementById('account-fn').value,
            lastName: document.getElementById('account-ln').value,
            email: document.getElementById('account-email').value,
            phone: document.getElementById('account-phone').value,
            password: document.getElementById('account-pass').value,
            confirmPassword: document.getElementById('account-confirm-pass').value,
            // subscribe: document.getElementById('subscribe_me').checked,
            base64Cover: document.getElementById('avatar-img').src // bao gồm type và string base64

        };
        try {
            // console.log(JSON.stringify(requestData));
            // console.log("request: " + requestData);
            const response = await fetch('/profile/updateProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            if (data.result === "ok") {
                alert("Update profile successfully");
                // Call a function to update the UI or get new data
                getAPI();
            } else {
                alert("Failed to update profile: " + (data.error || 'Unknown error'));
            }
        } catch (error) { 
            console.error('Error:', error);
            alert("An error occurred while updating the profile");

        }
    });
});
// chế độ previw ảnh avatar khi ngươif dùng muốn đổi avatar
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar-img').src = (e.target.result);
        }
        reader.readAsDataURL(file);
    }
}


/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------*/

//DISPLAY USER'S POST
async function displayUserPosts(datas) {
    // Get all the content divs
    var accountContent = document.getElementById('my-account-option');
    var mypostContent = document.getElementById('my-post-option');
    // var inboxContent = document.getElementById('inbox');
    var notificationContent = document.getElementById('notification');
    var logoutContent = document.getElementById('log-out');
    var allContent = [accountContent, mypostContent, notificationContent, logoutContent];
    // Ẩn nội dung các options khác
    allContent.forEach(function (item) {
        item.style.display = 'none';
    });

    const postsContainer = document.getElementById('my-post-option');

    /*List card post */
    var _content = `
    <div id="list-posts" class="container mt-3">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Raleway&display=swap">
            <div class="row">
    `;

    await datas.data.forEach((data, index) => {
        const postData = data.postData;
        _content += generatePostHTML(postData, index, data.username);
    });
    _content += `
            </div>
    </div>
    `;

    /*List card  modal */
    _content += `
        <div class="modal-container">
    `;

    datas.data.forEach((data, index) => {
        const postData = data.postData;
        const attachsData = data.attachsData;
        const commentsData = data.commentsData;
        _content += generatePostFadeHTML(postData, index, attachsData, commentsData, data.username);
    });
    _content += `
        </div>
    `;
    if (postsContainer) {
        postsContainer.innerHTML = _content;
    }
    else {
        console.log("postsContainer is null");
        return;
    }
    postsContainer.style.display = 'block';
    addEventModal();
}

// GENERTAE CARD POST
function generatePostHTML(post, index, username) {
    return `
    <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6 mb-3">
            <div class="card overflow-hidden no-border h-100 text-center" data-bs-toggle="modal" data-bs-target="#myModal${index}">
                <div class="position-relative">
                    <img src="data:image/png;base64,${post.coverPhoto}" class="card-img-top" alt="...">
                </div>
                <div class="card-body">
                    <h6 id="postTitle${index}" class="card-title truncate-to-2-lines fw-bold"> ${post.title} </h6>
                    <p id="postText${index}" class="card-text truncate-to-2-lines"> </p>
                    <p>   
                        Created at: ${post.createdAt} <br>
                        By ${username} <br>
                        Likes: ${post.numLikes}
                    </p>
                    
                </div>
            </div>
        </div>
    </div>
    `;
}


// GENERATE MODAL FOR CARD
function generatePostFadeHTML(post, index, attachs, comments, username) {

    var content = `
   
        <div class="modal fade" id="myModal${index}" tabindex="-1" aria-labelledby="exampleModalLabel"
            aria-hidden="true">
            <div style="display: none;" id="postID-${index}">${post._id}</div>
     
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <i class="bi bi-bookmark icon-in-top-left"> </i>
                            <img id="coverPhoto-${index}" src="data:image/png;base64, ${post.coverPhoto}" class="" alt="...">
                           
                            <button type="button" class="btn-close icon-in-top-right"
                                data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        
                        <h2 class="modal-title" id="title-${index}">${post.title}</h2>
                    </div>
                    <div class="modal-body">
                        <article>
                            <p>Created at: ${post.createdAt} By user: ${username}</p>
                            <h2> Content </h2>
                            <p class="just-line-break" id="postContent-${index}">${post.content}</p>
                            <hr class="separator">
                            <h2> Attachment </h2>
                            `;
    if (attachs) {
        if (attachs.type.startsWith("image/")) {
            content += `
                            <div class="image-container" id="imagePost${index}">
                                <a>
                                    <img id="attach-0" src=" data:${attachs.type};base64,${attachs.content}"
                                        class="card-img-top" alt="post attachment image">
                                </a>
                            </div>`;
        }
        else if (attachs.type.startsWith("ytlink")) {
            content += `
                            <div class="video-container">
                            <iframe width="560" height="315" src="${attachs.content}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>
            `;
        }
    }
    content += `    
                        </article>
                        <hr class="separator">
                        <aside>
                            <h2>Comments</h2>   
                            <div class="comments" id="postID-${index}-commentlist">
                                <ul class="list-group mb-2">
                `
    comments.forEach(comment => {
        content += `
                                    <li class="list-group-item align-items-start">
                                    <div class="d-flex justify-content-between">
                                        <div class="d-flex flex-row">
                                        <img style="aspect-ratio:1/1;width:40px;height:40px" class="rounded-circle" src="/photo/wp1.jpg" alt="...">
                                        <div class="container overflow-hidden">
                                                <span class="fw-bold d-flex flex-column">${comment.username}</span>
                                                <small style="color:#bbb">${comment.createdAt}</small> <!-- Chỉnh sửa để hiển thị thời gian -->
                                                <p class="small">${comment.content}</p>
                                            </div>
                                        </div>
                                        <i class="bi bi-three-dots-vertical "></i>
                                    </div>
                                </li>`;
    })

    content += `
                                </ul>

                                <div class="row height d-flex justify-content-center align-items-center">
                                    <div class="col-12">
                                        <div class="form form-comment">
                                            <i type="file" class="fa fa-camera"></i>
                                            <input type="text" class="form-control form-input"  data-modal-id="postID-${index}" name="comment" placeholder="Add a comment...">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary"
                            data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-secondary editBtn" data-modal-id="postID-${index}" 
                            data-bs-toggle="modal" >Edit</button>
                        <button type="button" class="btn btn-secondary deleteBtn" data-modal-id="postID-${index}" 
                            data-bs-toggle="modal" >Delete</button>
                    </div>
                </div>
            </div>
        </div>
        <!-- End list posts as modal -->
    `;
    return content;
}

// Gán sự kiện cho các card
function addEventModal() {
    console.log("Load post ok");
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
        card.addEventListener("click", function () {
            const modalId = `#myModal${index}`;
            const modal = new bootstrap.Modal(document.querySelector(modalId));
            modal.show();
        });
    });

    // Gắn sự kiện edit sau khi DOM đã được tải xong
    console.log("run in click edit");
    const editBtns = document.querySelectorAll('.editBtn');
    console.log(editBtns);
    editBtns.forEach(btn => {
        btn.addEventListener('click', () => {

            // Lấy key postID
            var post = btn.getAttribute('data-modal-id'); // data-modal-id="postID-${index}"
            // Lấy index của post
            var index = post.split('-')[1];
            // Lấy value postID
            var postIdElement = document.querySelector(`#${post}`);
            var id = postIdElement.textContent; // id của post trong db

            // Điền input cũ sẵn khi edit post
            const postTitleField = document.getElementById('postTitleEdit');
            const postTitleId = document.getElementById(`title-${index}`);
            const postTitleContent = postTitleId.textContent;
            postTitleField.value = postTitleContent;

            const postTextField = document.getElementById('postTextEdit');
            const postTextId = document.getElementById(`content-${index}`);
            const postTextContent = postTextId.textContent;
            postTextField.value = postTextContent;

            // Thêm id post vô form
            document.getElementById('postIdEdit').value = id;

            // Tạo bootstrap mở form
            // Lấy container form để edit post
            const modalEdit = document.getElementById('myModalEditPost');
            console.log(modalEdit);
            const myModalEditPost = new bootstrap.Modal(modalEdit);
            myModalEditPost.show();
        });
    });

    // Gắn sự kiện delete post
    const deleteBtns = document.querySelectorAll('.deleteBtn');
    console.log(deleteBtns);
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Lấy key postID
            var post = btn.getAttribute('data-modal-id'); // data-modal-id="postID-${index}"
            // Lấy value postID
            var postIdElement = document.querySelector(`#${post}`);
            var id = postIdElement.textContent; // id của post trong db
            // Thêm id post vô form
            document.getElementById('postIdDelete').value = id;
            console.log(id);
            const modalDelete = document.getElementById('myModalDeletePost');
            console.log(modalDelete);
            const myModalDeletePost = new bootstrap.Modal(modalDelete);
            myModalDeletePost.show();
        });
    });

}
/*------------------------------------------- */
// Các hàm delete post
async function deletePost(event) {
    event.preventDefault();
    var _postId = document.getElementById("postIdDelete").value;
    try {
        const response = await fetch("/profile/deletePost", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ _postId })
        })
        const data = await response.json();
        console.log('Response from server:', data);
        if (data.result == "ok") {
            alert("Deleted this post successfully.");
            window.location.href = "/profile";
        }
        else if (data.result == "not ok") {
            alert("Failed to delete a post");
        }
    }
    catch (error) {
        console.error('Error:', error);
        return false;
    };
}
/*------------------------------------------- */

/*------------------------------------------- */
// Các hàm update post

function updatePost(event) {
    event.preventDefault();
    var _postId = document.getElementById("postIdEdit").value;
    var _title = document.getElementById("postTitleEdit").value;
    var _content = document.getElementById("postTextEdit").value;
    var _postCoverphoto = document.getElementById("postCoverphotoEdit").files[0];
    var _uploadVideo = document.getElementById("uploadVideoEdit").value;
    var _uploadImage = document.getElementById("uploadImageEdit").files[0];
    var requestData = {
        postId: _postId,
        title: _title,
        content: _content,
    };
    console.log(requestData);
    console.log(_uploadVideo);
    if (_postCoverphoto) {
        const coverFileReader = new FileReader();
        coverFileReader.onload = function (e) {
            const coverPhotoBase64 = e.target.result.split(",")[1];
            requestData.base64Cover = coverPhotoBase64;
            sendFirst(requestData, function (success) {
                console.log(success);
                if (success) {
                    var res = false;
                    res = sendAttach(_postId, _uploadVideo, _uploadImage);
                    if (res == true) {
                        alert("Updated post successfully");
                        $('#myModalEditPost').modal('hide');
                    }
                    else {
                        alert("Failed to update a post when up attach");
                    }
                } else {

                    alert("Failed to update a post when up post");
                }
            });
        };
        coverFileReader.readAsDataURL(_postCoverphoto);
    } else {
        sendFirst(requestData, function (success) {
            console.log(success);
            if (success) {
                var res = false;
                console.log(requestData);
                res = sendAttach(_postId, _uploadVideo, _uploadImage);
                if (res == true) {
                    alert("Updated post successfully");
                    $('#myModalEditPost').modal('hide');
                }
                else {
                    alert("Failed to update a post when up attach");
                }
            } else {
                alert("Failed to update a post when up post");
            }
        });
    };
}
// send các thông cơ bản trước khi gửi attach
function sendFirst(requestData, callback) {
    fetch("/profile/updatePost", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.result == "ok") {
                console.log('Response from server:', data);
                callback(true);
            }
            else {
                callback(false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            return false;
        });
}

function sendAttach(_postId, _uploadVideo, _uploadImage) {
    try {
        var res = true;
        if (_uploadImage) {
            var attachData = {
                postId: _postId,
                type: _uploadImage.type,
                content: ""
            };
            const imageFileReader = new FileReader();
            imageFileReader.onload = function (e) {
                const imagePhotoBase64 = e.target.result.split(",")[1];
                attachData.content = imagePhotoBase64;
                res = send(attachData);
            }
            imageFileReader.readAsDataURL(_uploadImage);

        }
        if (_uploadVideo) {
            // Xử lý link embed
            const youtubeUrl = new URL(_uploadVideo);
            var videoId;
            if (youtubeUrl.hostname === "www.youtube.com" || youtubeUrl.hostname === "youtube.com") {
                videoId = youtubeUrl.searchParams.get("v");
            } else if (youtubeUrl.hostname === "youtu.be") {
                videoId = youtubeUrl.pathname.slice(1);
            }

            var embedUrl = `https://www.youtube.com/embed/${videoId}`;
            var attachData = {
                postId: _postId,
                type: "ytlink",
                content: embedUrl
            };
            res = send(attachData);
        }
        return res;
    }
    catch {
        return false;
    }
}
function send(requestData) {
    console.log(requestData);
    fetch("/profile/updatePost", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Response from server:', data);
            if (data.result == "ok") {
                return true;
            }
            else if (data.result == "not ok") {
                return false;
            }

        })
        .catch(error => {
            console.error('Error:', error);
            return false;
        });

}
// Kết thúc update post
/*------------------------------------------- */