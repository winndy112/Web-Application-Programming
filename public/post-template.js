document.addEventListener('DOMContentLoaded', async function () {
    const data = JSON.parse(document.getElementById('jsonData').textContent);
    console.log(data);
    var element = document.getElementById("jsonData");
    if (element) {
        element.parentNode.removeChild(element);
    }
    createPostElement(data);
    attachEventComment(data.post._id);
    //////////// gắn sự kiện khi người dùng star bài post  ////////////
    var favButtons = document.querySelectorAll('.fav-btn');
    favButtons.forEach(function (button) {
        button.addEventListener('click', async function (event) {
            event.preventDefault();
            // Lấy postId               

            var request = {
                postId: data.post._id
            }
            try {
                const response = await fetch("/index/newstar", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                });

                favData = await response.json();
                console.log(favData);
                if (data.result == "ok") {
                    alert("You liked this post");
                }
                else if (favData.result == "not ok") {
                    alert(favData.message);
                }
            }
            catch (error) {
                console.log(error)
                alert("error when like post", error);

            };
        });
    });
    //////////// gắn sự kiện khi người dùng click vào nút "Back to Home"  ////////////
    var closeButtons = document.getElementById('closeBlockpost');
    closeButtons.addEventListener('click', function () {
        window.location.href = '/index';
    });

});
//////////// convert time format //////////
function convertTimeFormat(timeString) {
    let date = new Date(timeString);
  
    let day = date.getDate();
    day = day < 10 ? '0' + day : day;
  
    let month = date.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
  
    let year = date.getFullYear();
  
    let hours = date.getHours();
    hours = hours < 10 ? '0' + hours : hours;
  
    let minutes = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes;
  
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
}
//////////// tạo card cho mỗi bài post ////////////
function createPostElement(data) {
    let title_page = document.getElementById('title-page');
    title_page.innerText = data.post.title;
    let mainPage = document.getElementById("main-page");
    let postTemplate = `
    <div class="blockpost" id="post-${data.post._id}" tabindex="-1" aria-labelledby="exampleBlockpostLabel" aria-hidden="true">
        <div class="blockpost-content">
            <div class="blockpost-header">
                <div>
                    <img class="blockpost-cover" id="coverPhoto-${data.post._id}" src="data:image/png;base64, ${data.post.coverPhoto}" alt="coverPhoto-${data.post._id}">
                </div>
                <h2 class="blockpost-title" id="title-${data.post._id}">${data.post.title}</h2>
                <p class="blockpost-extra-data col-12 offset-1">
                    Created at: ${convertTimeFormat(data.post.createdAt)} By ${data.username} 
                </p>
            </div>
            <div class="row">
                <div class="blockpost-body col-10 offset-1">
                    <article class="blockpost-article row">
                        <div class="content-container">
                            <p class="just-line-break" id="postContent-${data.post._id}">
                                ${data.post.content}
                            </p>
                        </div>
    `;

    if (data.attach) {
        if (data.attach.type.startsWith("image/")) {
            postTemplate += `
                        <div class="image-container">
                            <img src=" data:${data.attach.type};base64,${data.attach.content}" class="card-img-top" alt="post attachment image">
                        </div>
            `;
        }
        if (data.attach.type.startsWith("ytlink")) {
            postTemplate +=`
                        <div class="video-container">
                            <iframe width="560" height="315" src="${data.attach.content}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
            `;
        }
    }
    postTemplate += `
                    </article>
                    <hr class="separator">
                    <aside>
                        <h2>Comments</h2>
                        <div class="comments" id="commentlist">
                            <ul class="list-group mb-2">
    `;

    data.comments.forEach(comment => {
        postTemplate += `
                                <li class="list-group-item align-items-start">
                                    <div class="d-flex justify-content-between">
                                        <div class="d-flex flex-row">
                                            <img style="aspect-ratio:1/1;width:40px;height:40px" class="rounded-circle" src="/photo/wp1.jpg" alt="...">
                                            <div class="container overflow-hidden">
                                                <span class="fw-bold d-flex flex-column">${comment.username}</span>
                                                <small style="color:#bbb">${comment.createdAt}</small>
                                                <p class="small">
                                                    ${comment.content}
                                                </p>
                                            </div>
                                        </div>
                                        <i class="bi bi-three-dots-vertical "></i>
                                    </div>
                                </li>
        `;
    });
    postTemplate +=`
                            </ul>
                            <div class="row height d-flex justify-content-center align-items-center">
                                <div class="col-12">
                                    <div class="form form-comment">
                                        <i type="file" class="fa fa-camera"></i>
                                        <input type="text" class="form-control form-input" name="comment" placeholder="Add a comment...">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
        
                <!-- footer -->
                <div class="blockpost-footer col-12 offset-1">
                    <button type="button" id="closeBlockpost" class="btn btn-secondary" data-bs-dismiss="blockpost">Back to Home</button>
                    <!-- click => mở hàm lưu vào favorite -->
                    <button type="button" class="btn btn-primary fav-btn">Save to Favourites</button>
                </div>
            </div>
        </div>
    </div>
    `;
    mainPage.innerHTML = postTemplate;
}
//////////// gắn sự kiện khi người dùng bình luận cho bài viết ////////////
function attachEventComment(id) {
    const formComments = document.querySelectorAll(".form-comment");
    formComments.forEach(formComment => {
        // Tìm nút "Send" trong mỗi form và đính kèm sự kiện click
        const sendInput = formComment.querySelector(".form-input");
        sendInput.addEventListener("keypress", function (event) {
            // console.log(sendInput);
            if (event.key === "Enter") {
                event.preventDefault();
                const commentContent = sendInput.value.trim();
                // console.log(commentContent);
                if (commentContent !== "") {
                    var request = {
                        postId: id,
                        content: commentContent
                    }
                    fetch("/index/add-comment", {
                        method: "POST",
                        headers: {
                            'Content-type': 'application/json'
                        },
                        body: JSON.stringify(request),
                    }).then(res => res)
                        .then(data => {
                            var status = (data.status);
                            if (status == 200) {
                                data.json().then(jsonData => {
                                    // Giải nén dữ liệu JSON
                                    const { result, cmt, username, userId } = jsonData;
                                    const newCommentElement = document.createElement("li");
                                    newCommentElement.classList.add("list-group-item", "align-items-start");
                                    newCommentElement.innerHTML = `
                                        <div class="d-flex justify-content-between">
                                            <div class="d-flex flex-row">
                                                <img style="aspect-ratio:1/1;width:40px;height:40px" class="rounded-circle"
                                                    src="/photo/wp1.jpg" alt="...">
                                                <div class="container overflow-hidden">
                                                    <span class="fw-bold d-flex flex-column">${username}</span>
                                                    <small style="color:#bbb">${cmt.createdAt}</small>
                                                    <p class="small">${commentContent}</p>
                                                </div>
                                            </div>
                                            <i class="bi bi-three-dots-vertical"></i>
                                        </div>
                                    `;
                                    var commentsList = document.getElementById(`commentlist`);
                                    console.log(`commentlist`);
                                    commentsList.querySelector('ul').appendChild(newCommentElement);
                                    sendInput.value = "";
                                    // alert("Success");
                                });
                            } else {
                                alert("Failed to add new comment: " + data.error);
                            }
                        })
                        .catch(error => {
                            console.log("Error", error);
                        })
                } else {
                    console.log("Comment content is empty");
                }
            }
        });

    });
}