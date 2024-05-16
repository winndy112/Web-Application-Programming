
var currentPage; // Track current page
document.addEventListener("DOMContentLoaded", async function () {
    // hàm lắng nghe khi nhấn vào các card để hiện modal tuongư ứng 
    const cards = document.querySelectorAll(".card");
    const listItems = document.querySelectorAll(".list-group-item");
    cards.forEach((card, index) => {
        card.addEventListener("click", function () {
            const modalId = `#myModal${index + 1}`;
            const modal = new bootstrap.Modal(document.querySelector(modalId));
            modal.show();
        });
    });
    // // hàm xử lí lasted update
    // listItems.forEach(item => {
    //     const heading = item.querySelector("h6");
    //     const paragraph = item.querySelector("p");
    //     if (heading && paragraph && heading.textContent.trim() === "" && paragraph.textContent.trim() === "") {
    //         item.style.display = "none"; // Ẩn các <li> không có nội dung trong thẻ <h6> và <p>
    //     }
    // });

    currentPage = 1;
    renderPosts(currentPage);// mặc định load trang đầu tiên 
    /*------------------------------------------------------------------ */
    /* HÀM KHI NHẤN NÚT Gửi bình luận cho post */


    /*------------------------------------------------------------------ */
    /* HÀM KHI NHẤN NÚT STAR */
    var favButtons = document.querySelectorAll('.fav-btn');
    favButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            // Lấy data-modal-id của nút được nhấn
            var post = button.getAttribute('data-modal-id');
            var postIdElement = document.querySelector(`#${post}`);
            var id = postIdElement.textContent;

            var request = {
                postId: id
            }
            fetch("/index/newstar", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(request)
            })
                .then(res => res)
                .then(data => {
                    data = data.json();
                    if (data.result == "ok") {
                        alert("You liked this post");
                    }
                    else if (data.result == "not ok") {
                        alert("Error when like: ", data.error);
                    }
                })
                .catch(error => {
                    console.log(error)
                    alert("Please log in to like posts");

                });
        });
    });

    /*------------------------------------------------------------------ */
    // Hàm lắng nghe input search 
    const searchInput = document.getElementById("searchKeywords");
    searchInput.addEventListener("keypress", function (event) {
        // Check if the pressed key is "Enter"
        if (event.key === "Enter") {
            // Call a function to handle the search
            handleSearch();
        }
    });
});

/*------------------------------------------------------------------ */
/*------------------------------------------------------------------ */
/* Các hàm tạo post mới*/
function send(requestData) {
    fetch("/index/createPost", {
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
        });

}

function createPost(event) {
    // var res = false;
    event.preventDefault();
    var _title = document.getElementById("postTitle").value;
    var _content = document.getElementById("postText").value;
    var _postCoverphoto = document.getElementById("postCoverphoto").files[0];
    var _uploadVideo = document.getElementById("uploadVideo").files[0];
    var _uploadImage = document.getElementById("uploadImage").files[0];
    // var _uploadFile = document.getElementById("uploadFile").files[0];

    var requestData = {
        title: _title,
        content: _content,
        base64Cover: "",
    };
    if (_postCoverphoto) {
        const coverFileReader = new FileReader();
        coverFileReader.onload = function (e) {
            const coverPhotoBase64 = e.target.result.split(",")[1];
            requestData.base64Cover = coverPhotoBase64;
            sendFirst(requestData, function (success, postId) {
                if (success) {

                    sendAttach(postId, _uploadVideo, _uploadImage);
                } else {

                    alert("Failed to create a post when up post");
                }
            });
        };
        coverFileReader.readAsDataURL(_postCoverphoto);
    } else {
        sendFirst(requestData, function (success, postId) {
            if (success) {

                sendAttach(postId, _uploadVideo, _uploadImage);
            } else {

                alert("Failed to create a post when up post");
            }
        });
    };

}
function sendAttach(postId, _uploadVideo, _uploadImage) {
    var res = false;
    if (_uploadImage) {
        var attachData = {
            postId: postId,
            type: _uploadImage.type,
            content: "",
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
        var attachData = {
            postId: postId,
            type: _uploadVideo.type,
            content: "",
        };
        const videoFileReader = new FileReader();
        videoFileReader.onload = function (e) {
            const videoBase64 = e.target.result.split(",")[1];
            attachData.content = videoBase64;
            res = send(attachData);
        }
        videoFileReader.readAsDataURL(_uploadVideo);
    }

    if (res == true) {
        alert("Create new post successfully");
        $('#myModalNewPost').modal('hide');
    }
    else {
        alert("Failed to create a post when up attach");

    }
}
function sendFirst(requestData, callback) {
    fetch("/index/createPost", {
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
                const postId = data.post._id;
                callback(true, postId);
            }
            else {
                callback(false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

/*------------------------------------------------------------------ */
/*------------------------------------------------------------------ */
/*------------------------------------------------------------------ */
// hàm add button trang nếu số post nhièu hơn 4

function addLinkPage(totalPost) {
    var totalPage = Math.floor(totalPost / 4);
    if (totalPost % 4 != 0) {
        totalPage += 1;
    }
    const paginationContainer = document.querySelector(".pagination");
    var _page = paginationContainer.querySelectorAll(".page-item").length - 1;

    if (paginationContainer.querySelectorAll(".page-item").length - 1 < totalPage) {
        // Kiểm tra nếu đã đủ số lượng thẻ <li> thì dừng
        const pageItem = document.createElement("li");
        pageItem.classList.add("page-item");

        const pageLink = document.createElement("a");
        pageLink.classList.add("page-link");
        pageLink.href = "#";
        pageLink.textContent = _page + 1;
        pageLink.dataset.page = _page + 1;

        pageItem.appendChild(pageLink);
        paginationContainer.appendChild(pageItem);
        const nextPageItem = document.createElement("li");
        nextPageItem.classList.add("page-item");

        const nextPageLink = document.createElement("a");
        nextPageLink.classList.add("page-link");
        nextPageLink.href = "#";
        nextPageLink.innerHTML = '<i class="fa fa-angle-right"></i>';
        nextPageLink.dataset.page = currentPage + 1; // Trang tiếp theo sau trang hiện tại
        nextPageItem.appendChild(nextPageLink);
        paginationContainer.appendChild(nextPageItem);

        // handle khi người dùng nhán vào các nút số trang
        const paginationLinks = document.querySelectorAll(".page-link");
        paginationLinks.forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                const page = parseInt(this.getAttribute("data-page"));

                handlePaginationClick(page);
            });
        });
    }
}
function handlePaginationClick(page) {
    currentPage = page;
    renderPosts(currentPage);
}

async function renderPosts(page) {
    let totalPost = 0; // Khởi tạo totalPost với giá trị 0
    let i = 0;
    while (i < totalPost || totalPost === 0) {
        totalPost = await get(page, i % 4);
        i++;
    }
    attachEventComment();
    console.log("render success...");
}

async function get(page, i) {
    try {
        // fetch để get 1 bài post trong page được chọn
        const response = await fetch(`/index/newsfeed/${page}/${i}`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // đảm bảo kết quả trả về là json
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            // console.log(data);
            const totalPost = data.total;
            addLinkPage(totalPost);
            const postIndex = i + 1;
            
            // cập nhật card post
            const imageElement = document.querySelector(`#post${postIndex}.card-img-top`);
            const titleElem = document.querySelector(`#postTitle${postIndex}.card-title`);
            const text = document.querySelector(`#postText${postIndex}.card-text`);
            const postID = document.querySelector(`#postID-${postIndex}`);
            postID.textContent = data.post._id;
            titleElem.textContent = data.post.title;
            text.innerHTML = `
                    <p>Created at: ${data.post.createdAt} By ${data.username} <br>
                        Likes: ${data.post.numLikes}
                    </p>
                `;
            imageElement.src = "data:image/png;base64," + data.post.coverPhoto;
            /*-------------------------------------------------------------------------*/

            // Cập nhật thông tin trong modal
            const modal = document.querySelector(`#myModal${postIndex}`);
            const modalTitle = modal.querySelector(".modal-title");
            const modalContent = modal.querySelector(".modal-body");
            const modalCover = modal.querySelector(`#coverPhoto-${postIndex}`);
            modalTitle.textContent = data.post.title;
            modalCover.src = "data:image/png;base64," + data.post.coverPhoto;
            // console.log(modalCover);
            var _content = `
                    <article>
                        <p>Created at: ${data.post.createdAt} By user: ${data.username}</p>
                        <h2> Content </h2>
                        <p>${data.post.content}</p>
                `;

            // Kiểm tra xem có đính kèm không và kiểm tra loại của đính kèm
            if (data.attach) {
                if (data.attach.type.startsWith("image/")) {
                    // Nếu là ảnh, thêm vào image containe  r
                    _content += `
                        <hr class="separator">
                        <h2> Attachment </h2>
                            <div class="image-container">
                                <a>
                                    <img src=" data:${data.attach.type};base64,${data.attach.content}" class="card-img-top" alt="post attachment image">
                                </a>
                            </div>
                        
                        `;
                } else if (data.attach.type.startsWith("video/")) {
                    // Nếu là video, thêm vào video container
                    _content += `
                        <div class="video-container">
                            <iframe width="560" height="315" src="${data.attach.content}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                        
                        `;
                }
            }
            _content += `
                        </article>
                        <hr class="separator">
                        <aside>
                            <h2>Comments</h2>
                            <hr>
                            <div class="comments" id="postID-${postIndex}-commentlist">
                                <ul class="list-group mb-2">
                    `;
            // hiện tất cả comment của bài post 
            data.comments.forEach(comment => {
                _content += `
                                    <li class="list-group-item align-items-start">
                                        <div class="d-flex justify-content-between">
                                            <div class="d-flex flex-row">
                                            <img style="aspect-ratio:1/1;width:40px;height:40px" class="rounded-circle" src="/photo/wp1.jpg" alt="...">
                                                <div class="container overflow-hidden">
                                                    <span class="fw-bold d-flex flex-column">${comment.username}</span>
                                                    <small style="color:#bbb">${comment.createdAt}</small>
                                                    <p class="small">${comment.content}</p>
                                                </div>
                                            </div>
                                            <i class="bi bi-three-dots-vertical "></i>
                                        </div>
                                    </li>
                                    `;
            });
            // phần input để người dùng nhập comment và add comment mới  cho bài post       
            _content += `
                                </ul>

                                <div class="row height d-flex justify-content-center align-items-center">
                                    <div class="col-12">
                                        <div class="form form-comment">
                                            <i type="file" class="fa fa-camera"></i>
                                            <input type="text" class="form-control form-input"  data-modal-id="postID-${postIndex}"
                                                name="comment" placeholder="Add a comment...">
                                            
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </aside>
                `;
            if (modalContent) {
                modalContent.innerHTML = _content;

            } else {
                console.error("Modal content not found");
            }
            return data.totalPostOfPage;
        } else {
            console.error('Response was not JSON');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

/*------------------------------------------------------------------ */
/*------------------------------------------------------------------ */
/*------------------------------------------------------------------ */
var searchPost = []
function handleSearch() {
    const keywords = document.getElementById("searchKeywords").value;

    fetch(`/index/search/${keywords}`, {
        method: "POST",
    }).then(res => res.json())
        .then(data => {
            searchPost = data.posts;
            showSearchPosts()
        })
        .catch(error => {
            console.log("Error", error);
        })
}

function showSearchPosts() {
    const cardContainer = document.querySelector(".card-container");
    const modalContainer = document.querySelector(".modal-container");
    cardContainer.innerHTML = "";
    modalContainer.innerHTML = "";
    if (searchPost) {
        let totalPost = searchPost.length;
        let i = 0;
        while (i < totalPost) {
            addCardAndModal(searchPost[i], i + 1);
            i++;
        }
        attachEventComment();
    }
    else alert("Don't have post contains keywords");
    
}

function addCardAndModal(data, index) {
    // Tạo card mới
    var cardHtml = `
        <div class="col-12 col-xl-6 mb-3">
            <div class="card overflow-hidden no-border h-100" data-bs-toggle="modal" data-bs-target="#myModal${index}">
                <div style="display: none;" id="postID-${index}"> ${data.post._id}</div>
                <div class="position-relative">
                    <a>
                        <img id="post${index}" src="data:image/png;base64,${data.post.coverPhoto}"  class="card-img-top" alt="...">
                    </a>
                </div>
                <div class="card-body">
                    <h6 id="postTitle${index}" class="card-title truncate-to-2-lines fw-bold"> ${data.post.title} </h6>
                    <p id="postText${index}" class="card-text truncate-to-2-lines">
                        Created at: ${data.post.createdAt} By ${data.username} <br>
                        Likes: ${data.post.numLikes}
                    </p>
                </div>
            </div>
        </div>
    `;

    // Tạo modal mới
    var modalHtml = `
        <div class="modal fade" id="myModal${index}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <i class="bi bi-bookmark icon-in-top-left"> </i>
                            <img id="coverPhoto-${index}" src="data:image/png;base64, ${data.post.coverPhoto}" class="" alt="...">
                            <button type="button" class="btn-close icon-in-top-right"
                                data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <h2 class="modal-title" id="title-${index}"> ${data.post.title}</h2>
                    </div>

                    <div class="modal-body">
                        <article>
                            <p>Created at: ${data.post.createdAt} By user: ${data.username}</p>
                            <h2> Content </h2>
                            <p>${data.post.content}</p>
                            <hr class="separator">
                            <h2> Attachment </h2>
    `;
    if (data.attach) {
        if (data.attach.type.startsWith("image/")) {
            modalHtml += `
                            <div class="image-container">
                                <a>
                                    <img src=" data:${data.attach.type};base64,${data.attach.content}" class="card-img-top" alt="post attachment image">
                                </a>
                            </div>

            `;
        }
        if (data.attach.type.startsWith("video/")) {
            modalHtml +=
                `
                            <div class="video-container">
                                <iframe width="560" height="315" src="${data.attach.content}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>
            `;

        }
    }

    modalHtml += `
                        </article>
                    <hr class="separator">
                    <!-- comment -->
                    <aside>
                        <h2> Comments</h2>
                        <hr>
                        <div class="comments" id="postID-${index}-commentlist">
                            <ul class="list-group mb-2">
                `
    data.comments.forEach(comment => {
        modalHtml += `
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
                                </li>
        `;
    });
modalHtml += `
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
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <!-- click => mở hàm lưu vào favorite -->
                    <button type="button" class="btn btn-primary fav-btn" data-modal-id="postID-${index}">Save to Favourites</button>
                </div>
            </div>
        </div>
    </div>
`;

    const cardContainer = document.querySelector(".card-container");
    const modalContainer = document.querySelector(".modal-container");
    if (cardContainer && modalContainer) {
        cardContainer.insertAdjacentHTML("beforeend", cardHtml);
        modalContainer.insertAdjacentHTML("beforeend", modalHtml);
    } else {
        console.error("Card container or modal container is null");
    }
}

/*------------------------------------------------------------------ */
/*------------------------------------------------------------------ */
/*------------------------------------------------------------------ */
function attachEventComment() {
    const formComments = document.querySelectorAll(".form-comment");
    formComments.forEach(formComment => {
        // Tìm nút "Send" trong mỗi form và đính kèm sự kiện click
        const sendInput = formComment.querySelector(".form-input");
        sendInput.addEventListener("keypress", function (event) {
            // console.log(sendInput);
            if (event.key === "Enter") {
                event.preventDefault();
                var postId = sendInput.getAttribute('data-modal-id');
                var postIdElement = document.querySelector(`#${postId}`);
                var id = postIdElement.textContent;
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
                    })  .then(res => res)
                        .then(data => {
                            var status  = (data.status);
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
                                var commentsList = document.getElementById(`${postId}-commentlist`);
                                console.log(`${postId}-commentlist`);
                                commentsList.querySelector('ul').appendChild(newCommentElement);
                                sendInput.value = "";
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
