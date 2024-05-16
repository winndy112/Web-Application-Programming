

// Create event click optaion
async function getAPI() {
    try {
        const response = await fetch(`/profile/api`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            console.log(data);
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
        document.querySelector('.author-card-avatar img').src = "data:image/png;base64," + meta.cover;
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

document.addEventListener("DOMContentLoaded", function () {
    // Get all the option links
    //
    getAPI();
    var accountOption = document.querySelector('.account-option');
    var mypostOption = document.querySelector('.mypost-option');
    var inboxOption = document.querySelector('.inbox-option');
    var notificationsOption = document.querySelector('.notifications-option');
    var logoutOption = document.querySelector('.logout-option');
    // Get all the content divs
    var accountContent = document.getElementById('my-account-option');
    var mypostContent = document.getElementById('my-post-option');
    var inboxContent = document.getElementById('inbox');
    var notificationContent = document.getElementById('notification');
    var logoutContent = document.getElementById('log-out');
    var allContent = [accountContent, mypostContent, inboxContent, notificationContent, logoutContent];
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
    inboxOption.addEventListener('click', function () {
        showContent(inboxContent);
    });
    notificationsOption.addEventListener('click', function () {
        showContent(notificationContent);
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
                    addEventModal();
                    // Gắn sự kiện edit Post
                    const editBtn = document.querySelectorAll('.editBtn');
                    editBtn.forEach(btn => {
                        btn.addEventListener('click', () => {
                            console.log("click edit ok");
                            const myModalEditPost = new bootstrap.Modal(document.getElementById('myModalEditPost'));
                            myModalEditPost.show();
                            //const object = document.getElementById('form-new-posts');
                            //object.style.display = "block";
                        });
                    });
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
});



const dismissAll = document.getElementById('dismiss-all');
const dismissBtns = Array.from(document.querySelectorAll('.dismiss-notification'));

const notificationCards = document.querySelectorAll('.notification-card');

dismissBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.preventDefault;
        var parent = e.target.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
        parent.classList.add('display-none');
    })
});

dismissAll.addEventListener('click', function (e) {
    e.preventDefault;
    notificationCards.forEach(card => {
        card.classList.add('display-none');
    });
    const row = document.querySelector('.notification-container');
    const message = document.createElement('h4');
    message.classList.add('text-center');
    message.innerHTML = 'All caught up!';
    row.appendChild(message);
})

// /* Các hàm cập nhật post mới */
// function send(requestData) {
//     fetch("/profile/updatePost", {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestData)

//     })
//         .then(response => response.json())
//         .then(data => {
//             /*console.log('Response from server:', data);
//             if (data.result == "ok") {
//                 return true;
//             }
//             else if (data.result == "not ok") {
//                 return false;
//             }*/

//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });

// }

// function updatePost(event, _postId) {
//     var res = false;
//     event.preventDefault();
//     var _title = document.getElementById("postTitle").value;
//     var _content = document.getElementById("postText").value;
//     var _postCoverphoto = document.getElementById("postCoverphoto").files[0];
//     var _uploadVideo = document.getElementById("uploadVideo").files[0];
//     var _uploadImage = document.getElementById("uploadImage").files[0];
//     var myModal = btn.closest('.modal'); // Tìm modal chứa nút "Edit" được click
//     var postId = myModal.dataset.postId;
//     // var _uploadFile = document.getElementById("uploadFile").files[0];

//     var requestData = {
//         postId: _postId,
//         title: _title,
//         content: _content,
//         base64Cover: "",
//     };
//     if (_postCoverphoto) {
//         const coverFileReader = new FileReader();
//         coverFileReader.onload = function (e) {
//             const coverPhotoBase64 = e.target.result.split(",")[1];
//             requestData.base64Cover = coverPhotoBase64;
//             sendFirst(requestData, function (success, postId) {
//                 if (success) {

//                     sendAttach(postId, _uploadVideo, _uploadImage);
//                 } else {

//                     alert("Failed to create a post when up post");
//                 }
//             });
//         };
//         coverFileReader.readAsDataURL(_postCoverphoto);
//     } else {
//         sendFirst(requestData, function (success, postId) {
//             if (success) {

//                 sendAttach(postId, _uploadVideo, _uploadImage);
//             } else {

//                 alert("Failed to create a post when up post");
//             }
//         });
//     };
// }

// function sendAttach(postId, _uploadVideo, _uploadImage) {
//     var res = false;
//     if (_uploadImage) {
//         var attachData = {
//             postId: postId,
//             type: _uploadImage.type,
//             content: "",
//         };
//         const imageFileReader = new FileReader();
//         imageFileReader.onload = function (e) {
//             const imagePhotoBase64 = e.target.result.split(",")[1];
//             attachData.content = imagePhotoBase64;
//             res = send(attachData);
//         }
//         imageFileReader.readAsDataURL(_uploadImage);

//     }
//     if (_uploadVideo) {
//         var attachData = {
//             postId: postId,
//             type: _uploadVideo.type,
//             content: "",
//         };
//         const videoFileReader = new FileReader();
//         videoFileReader.onload = function (e) {
//             const videoBase64 = e.target.result.split(",")[1];
//             attachData.content = videoBase64;
//             res = send(attachData);
//         }
//         videoFileReader.readAsDataURL(_uploadVideo);
//     }
//     if (res == true) {
//         alert("Update post successfully");
//         $('#myModalEditPost').modal('hide');
//     }
//     else {
//         alert("Failed to update a post when up attach");

//     }
// }
// function sendFirst(requestData, callback) {
//     fetch("/profile/updatePost", {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestData)
//     })
//         .then(response => response.json())
//         .then(data => {
//             console.log('Response from server:', data);
//             if (data.result == "ok") {
//                 const postId = data.post._id;
//                 callback(true, postId);
//             }
//             else {
//                 callback(false);
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// }



/*------------------------------------------- */
/*------------------------------------------- */
//DISPLAY USER'S POST
async function displayUserPosts(datas) {
    // Get all the content divs
    var accountContent = document.getElementById('my-account-option');
    var mypostContent = document.getElementById('my-post-option');
    var inboxContent = document.getElementById('inbox');
    var notificationContent = document.getElementById('notification');
    var logoutContent = document.getElementById('log-out');
    var allContent = [accountContent, mypostContent, inboxContent, notificationContent, logoutContent];
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
        _content += generatePostHTML(postData, index, username);
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
                    <p id="postText${index}" class="card-text truncate-to-2-lines">
                        Created at: ${post.createdAt} By ${username} <br>
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
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <i class="bi bi-bookmark icon-in-top-left"> </i>
                            <img id="coverPhoto-${index}" src="data:image/png;base64, ${post.coverPhoto}" class="" alt="...">
                           
                            <button type="button" class="btn-close icon-in-top-right"
                                data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        
                        <h2 class="modal-title" id="title-${index}">${post.title}</h5>
                    </div>
                    <div class="modal-body">
                        <article>
                            <p>Created at: ${post.createdAt} By user: ${username}</p>
                            <h2> Content </h2>
                            <p>${post.content}</p>
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
        else if (attachs.type.startsWith("video/")) {
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
                            <hr>
                            <div class="comments" id="postID-${index}-commentlist">
                                <ul class="list-group mb-2">
                `
    comments.forEach(comment =>{
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
                        <button type="button" class="btn btn-secondary editBtn" id="editBtn"
                            data-bs-toggle="modal" data-bs-target="#myModalEditPost" >Edit</button>
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
}