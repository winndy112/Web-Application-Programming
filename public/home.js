
var currentPage; // Track current page

////////////// những hoạt động mặc định //////////////
document.addEventListener("DOMContentLoaded", async function () {
    // hàm lắng nghe khi nhấn vào các card để hiện modal tương ứng 
    currentPage = 1;
    addEventClick();
    renderPosts(currentPage);// mặc định load trang đầu tiên khi vào trang
    lastestUpdate(); // mặc định load 10 hoạt động gần nhất
    /*------------------------------------------------------------------ */
    // Hàm lắng nghe input search 
    const searchInput = document.getElementById("searchKeywords");
    // Lắng nghe sự kiện input để gọi hàm xử lí autocomplete
    const resultsDropdown = document.createElement('select');
    resultsDropdown.setAttribute('id', 'autocompleteResults');
    resultsDropdown.style.display = 'none';
    searchInput.parentNode.appendChild(resultsDropdown);
    resultsDropdown.addEventListener('change', function () {
        searchInput.value = resultsDropdown.options[resultsDropdown.selectedIndex].text;
        clearAutocompleteResults();
        handleSearch();
    });

    // lắng nghe sự kiện nhấn enter để tìm kiếm
    searchInput.addEventListener("keyup", function (event) {
        // Check if the pressed key is "Enter"
        if (event.key === "Enter") {
            clearAutocompleteResults(); 
            handleSearch();
        }
        if (event.key === "Backspace" || event.key === "Delete") {
            if( searchInput.value == ""){
                clearAutocompleteResults();
            }
        }
    });

    // hàm check khi người dùng nhập vào khung input search
    searchInput.addEventListener("keydown", async function (event) {
        if (event.key != "Enter"){
            const query = searchInput.value;
            if (query.length >= 2) { // Only trigger autocomplete after 3 characters
                try {
                    const response = await fetch(`/index/searchone?t=${query}`);
                    const results = await response.json();
                    console.log(results.length);
                    if (results.length == 0){
                        clearAutocompleteResults();
                    }
                    else {
                        displayAutocompleteResults(results);
                    }
                } catch (error) {
                    console.error('Error fetching autocomplete results:', error);
                }
            }
        }
    });
    const filterIcon = document.getElementById("filterIcon");
    filterIcon.addEventListener("click", () =>{
        // Tạo bootstrap mở form
        // Lấy container form để edit post
        const modalFilter = document.getElementById('myModalFilter');
        const myModalFilterPost = new bootstrap.Modal(modalFilter);
        myModalFilterPost.show();
    });
});
// kết thúc DOM load

/* Các hàm tạo post mới*/
async function createPost(event) {
    event.preventDefault();
    var _title = document.getElementById("postTitle").value;
    var _content = document.getElementById("postText").value;
    var _postCoverphoto = document.getElementById("postCoverphoto").files[0];
    var _uploadVideo = document.getElementById("uploadVideo").value;
    var _uploadImage = document.getElementById("uploadImage").files[0];
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
                    sendAttach(postId, _uploadVideo, _uploadImage)
                    .then(res => {
                        if (res === true) {
                            alert("Create new post successfully");
                            
                            document.getElementById("postTitle").value = "";
                            document.getElementById("postText").value = "";
                            document.getElementById("postCoverphoto").value = "";
                            document.getElementById("uploadVideo").value = "";
                            document.getElementById("uploadImage").value = "";
                        } else {
                            alert("Failed to create a post when uploading attachments");
                        }
                    });
                } else {
                    alert("Failed to create a post");
                }
            });
        };
        coverFileReader.readAsDataURL(_postCoverphoto);
    } else {
        sendFirst(requestData, function (success, postId) {
            if (success) {
                sendAttach(postId, _uploadVideo, _uploadImage)
                .then(res => {
                    if (res === true) {
                        alert("Create new post successfully");
                        
                        document.getElementById("postTitle").value = "";
                        document.getElementById("postText").value = "";
                        document.getElementById("postCoverphoto").value = "";
                        document.getElementById("uploadVideo").value = "";
                        document.getElementById("uploadImage").value = "";
                    } else {
                        alert("Failed to create a post when uploading attachments");
                    }
                });
            } else {
                alert("Failed to create a post");
            }
        });
    }
}
////////////// gửi request tạo attachment cho bài post mới //////////////
function sendAttach(postId, _uploadVideo, _uploadImage) {
    return new Promise(async (resolve, reject) => {
        try {
            var res = true;
            if (_uploadImage) {
                const imageFileReader = new FileReader();
                imageFileReader.onload = async function (e) {
                    const imagePhotoBase64 = e.target.result.split(",")[1];
                    var attachData = {
                        postId: postId,
                        type: _uploadImage.type,
                        content: imagePhotoBase64,
                    };
                    res = await send(attachData);
                    if (!res) {
                        return resolve(false);
                    }
                };
                imageFileReader.readAsDataURL(_uploadImage);
            }
            if (_uploadVideo) {
                var attachData = {
                    postId: postId,
                    type: "ytlink",
                    content: _uploadVideo,
                };
                res = await send(attachData);
                if (!res) {
                    return resolve(false);
                }
            }
            resolve(true);
        } catch (error) {
            reject(false);
        }
    });
}
function send(requestData) {
    return new Promise((resolve, reject) => {
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
                resolve(true);
            } else if (data.result == "not ok") {
                resolve(false);
            } else {
                reject(new Error("Unexpected response"));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            reject(error);
        });
    });
}
////////////// gửi request tạo post mới //////////////
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
                alert(data.message);
                callback(false);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

////////////// hàm add button trang nếu số post nhièu hơn 4 //////////////
function addLinkPage(totalPost) {
    var totalPage = Math.floor(totalPost / 4);
    if (totalPost % 4 != 0) {
        totalPage += 1;
    }
    const paginationContainer = document.querySelector(".pagination");
    var _page = paginationContainer.querySelectorAll(".page-item").length - 1; // page hiện tại: 1
    while (_page < totalPage) {
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
        // handle khi người dùng nhán vào các nút số trang
        const paginationLinks = document.querySelectorAll(".page-link");
        paginationLinks.forEach(link => {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                const page = parseInt(this.getAttribute("data-page"));

                handlePaginationClick(page);
            });
        });
        _page += 1;
    }
    
}
////////////// render page mới khi người dùng chuyển trang //////////////
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
    if (i < 4) {
        for (i; i<4; i++) {
            const postIndex = i + 1;
            const element = document.querySelector(`#thePost${postIndex}`);
            element.style.display = 'none';
        }
    }
}
////////////// get một post trong 1 page 
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
            const totalPost = data.total;
            const paginationContainer = document.querySelector(".pagination");
            // nếu đủ link page thì không cần add thêm
            if (totalPost != paginationContainer.querySelectorAll(".page-item").length - 1) {
                addLinkPage(totalPost);
            }
            
            const postIndex = i + 1;
            const element = document.querySelector(`#thePost${postIndex}`);
            element.style.display = 'block';
            // cập nhật card post
            const imageElement = document.querySelector(`#post${postIndex}.card-img-top`);
            const titleElem = document.querySelector(`#postTitle${postIndex}.card-title`);
            const text = document.querySelector(`#postText${postIndex}.card-text`);
            const postID = document.querySelector(`#postID-${postIndex}`);
            postID.textContent = data.post._id;
            titleElem.textContent = data.post.title;
            text.innerHTML = `
                    <p>Created at: ${convertTimeFormat(data.post.createdAt)} by ${data.username} <br>
                        Likes: ${data.post.numLikes}
                    </p>
                `;
            if (data.post.coverPhoto) 
                {
                    imageElement.src = "data:image/png;base64," + data.post.coverPhoto;
                }
            else {
                imageElement.src = "photo/dan-len-hand-made.jpg";
            }
            /*-------------------------------------------------------------------------*/
            return data.totalPostOfPage;
        } else {
            console.error('Response was not JSON');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}
////////////// add event click vào các card để hiện post tương ứng //////////////
function addEventClick() {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
        card.addEventListener("click", async function () {
            const cardid = `postID-${index + 1}`;
            const postIdElement = document.querySelector(`#${cardid}`);
            //request để lấy slug của bài post bằng postId
            const res = await fetch(`/post/${postIdElement.textContent}`, { 
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) {  
                throw new Error('Network response was not ok');
            }
            const data = await res.json();
            // chuyển hướng tới url mới của bài post
            window.location.href = `${data.url}`;
        });
    });
}
////////////// hàm hiển thị menu các chuỗi autocomplete //////////////
function displayAutocompleteResults(results) {
    // console.log("display");
    resultsDropdown = document.getElementById('autocompleteResults');
    clearAutocompleteResults();
    resultsDropdown.style.display = 'block';
    results.forEach(result => {
        const option = document.createElement('option');
        option.value = result._id;
        option.text = result.title;
        resultsDropdown.appendChild(option);
    });
    resultsDropdown.setAttribute('size', results.length + 1); 
}
////////////// hàm xóa menu autocomplete //////////////
function clearAutocompleteResults() {
    let resultsDropdown = document.getElementById('autocompleteResults');
    resultsDropdown.innerHTML = '';
    resultsDropdown.style.display = 'none';

}
////////////// gửi request search post theo keywords //////////////
var searchPost = []
function handleSearch() {
    const cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = `
    <p> loading... </p>
    `;
    const keywords = document.getElementById("searchKeywords").value;
    document.getElementById("searchKeywords").value = "";
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
        
        // clearAutocompleteResults();
}
//////////////// show các bài post được tìm thấy //////////////
function showSearchPosts() {
    const cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = "";
    if (searchPost.length != 0) {
        let totalPost = searchPost.length;
        let i = 0;
        while (i < totalPost) {
            addCardAndModal(searchPost[i], i + 1);
            i++;
        }
        addEventClick();
    }
    else {
        alert("Don't have post contains keywords");
        renderPosts(currentPage);
    }
}

function addCardAndModal(data, index) {
    // Tạo card mới
    var cardHtml = `
        <div class="col-12 col-xl-6 mb-3">
            <div class="card overflow-hidden no-border h-100" data-bs-toggle="modal" data-bs-target="#myModal${index}">
                <div style="display: none;" id="postID-${index}">${data.post._id}</div>
                <div class="position-relative">
                    <a>
                        <img id="post${index}" src="data:image/png;base64,${data.post.coverPhoto}" class="card-img-top" alt="...">
                    </a>
                </div>
                <div class="card-body">
                    <h6 id="postTitle${index}" class="card-title truncate-to-2-lines fw-bold"> ${data.post.title} </h6>
                    <p id="postText${index}" class="card-text truncate-to-2-lines">
                        Created at: ${convertTimeFormat(data.post.createdAt)} by ${data.username} <br>
                        Likes: ${data.post.numLikes}
                    </p>
                </div>
            </div>
        </div>
    `;
    const cardContainer = document.querySelector(".card-container");
    // const modalContainer = document.querySelector(".modal-container");
    if (cardContainer) {
        cardContainer.insertAdjacentHTML("beforeend", cardHtml);
        // modalContainer.insertAdjacentHTML("beforeend", modalHtml);
    } else {
        console.error("Card container or modal container is null");
    }

}


// function attachEventComment() {
//     const formComments = document.querySelectorAll(".form-comment");
//     formComments.forEach(formComment => {
//         // Tìm nút "Send" trong mỗi form và đính kèm sự kiện click
//         const sendInput = formComment.querySelector(".form-input");
//         sendInput.addEventListener("keypress", function (event) {
//             // console.log(sendInput);
//             if (event.key === "Enter") {
//                 event.preventDefault();
//                 var postId = sendInput.getAttribute('data-modal-id');
//                 var postIdElement = document.querySelector(`#${postId}`);
//                 var id = postIdElement.textContent;
//                 const commentContent = sendInput.value.trim();
//                 // console.log(commentContent);
//                 if (commentContent !== "") {
//                     var request = {
//                         postId: id,
//                         content: commentContent
//                     }
//                     fetch("/index/add-comment", {
//                         method: "POST",
//                         headers: {
//                             'Content-type': 'application/json'
//                         },
//                         body: JSON.stringify(request),
//                     }).then(res => res)
//                         .then(data => {
//                             var status = (data.status);
//                             if (status == 200) {
//                                 data.json().then(jsonData => {
//                                     // Giải nén dữ liệu JSON
//                                     const { result, cmt, username, userId } = jsonData;
//                                     const newCommentElement = document.createElement("li");
//                                     newCommentElement.classList.add("list-group-item", "align-items-start");
//                                     newCommentElement.innerHTML = `
//                                         <div class="d-flex justify-content-between">
//                                             <div class="d-flex flex-row">
//                                                 <img style="aspect-ratio:1/1;width:40px;height:40px" class="rounded-circle"
//                                                     src="/photo/wp1.jpg" alt="...">
//                                                 <div class="container overflow-hidden">
//                                                     <span class="fw-bold d-flex flex-column">${username}</span>
//                                                     <small style="color:#bbb">${cmt.createdAt}</small>
//                                                     <p class="small">${commentContent}</p>
//                                                 </div>
//                                             </div>
//                                             <i class="bi bi-three-dots-vertical"></i>
//                                         </div>
//                                     `;
//                                     var commentsList = document.getElementById(`${postId}-commentlist`);
//                                     console.log(`${postId}-commentlist`);
//                                     commentsList.querySelector('ul').appendChild(newCommentElement);
//                                     sendInput.value = "";
//                                 });
//                             } else {
//                                 alert("Failed to add new comment: " + data.error);
//                             }
//                         })
//                         .catch(error => {
//                             console.log("Error", error);
//                         })
//                 } else {
//                     console.log("Comment content is empty");
//                 }
//             }
//         });

//     });
// }
/// Solve refresh token
/*------------------------------------------------------------------ */

// var originalFetch = window.fetch;
// // alert("fetchout");
// window.fetch = async function () {
//     alert("fetch");
//     let response = await originalFetch.apply(this);
//     // If response status is 401, try to refresh the token
//     if (response.status === 401) {
//         fetch('/user/refresh-token', {
//             method: 'POST'
//         })
//         .then (res => res.json())
//         .then (data => {
//             if (data.success === true) {
//                 // If the refresh token is successful, retry the original request
//                 return originalFetch.apply(this);
//             }        
//         })
//     }
//     // Return the response so the rest of the code can use it
//     return response;
// };

/// End solve refresh token

/// Lastest Update

////////////// chuyển đổi format của thời gian //////////////
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
////////////// hiển thị list các hoạt động //////////////
async function displayListItems(listItems, elementId) {
    let listElement = document.getElementById(elementId);
    while (listElement.firstChild) {
        listElement.removeChild(listElement.firstChild);
    }
    // alert(listItems.length);
    if (listItems.length === 0) {
        const notifi = elementId === "list-lastest-posts" ? "You haven't created any post yet" : elementId === "list-lastest-comments" ? "You haven't commented on any post yet" : "You haven't saved any post yet";
        let id = elementId === "list-lastest-posts" ? "noti-posts" : elementId === "list-lastest-comments" ? "noti-comments" : "noti-favorites";
        let noti = document.getElementById(`${id}`);   
        noti.textContent = notifi;    
    }
    else {
        let id = elementId === "list-lastest-posts" ? "noti-posts" : elementId === "list-lastest-comments" ? "noti-comments" : "noti-favorites";    
        let noti = document.getElementById(`${id}`);
        noti.style.display = "none";
        
        const createListItem = async (item, getUrl) => {
            let fullday = convertTimeFormat(item.updatedAt || item.original.updatedAt);
            let listItem = document.createElement("li");
            listItem.id = `${elementId.split('-')[1]}-${item.postId}`;
            listItem.classList.add("list-group-item", "d-flex", "align-items-start");
            const url = await getSlug(getUrl(item));
            
            listItem.innerHTML = `
                <div class="container overflow-hidden">
                    <h6 class="text-truncate lastest-update-content">
                        <a class='link-title' href='${url}'>
                            ${elementId === "list-lastest-posts" ? `You created/updated a post - ${item.title}` : elementId === "list-lastest-comments" ? `You commented on a post - ${item.extra.postTitle}` : `You saved a post - ${item.extra.postTitle}`}
                        </a>
                    </h6>
                    ${elementId !== "list-lastest-posts" ? `<p class="text-truncate small lastest-update-time lastest-update-content"><b>Author</b> - ${item.extra.authorUsername}</p>` : ""}
                    <p class="text-truncate small lastest-update-time lastest-update-content"><b>At</b> - ${fullday}</p>
                </div>
            `;
            listElement.appendChild(listItem);
            let hr = document.createElement("hr");
            hr.classList.add("top-separator");
            listElement.appendChild(hr);
        };
    
        const getUrl = item => elementId === "list-lastest-posts" ? item._id.trim() : item.original.postId.trim();
    
        for (let item of listItems) {
            await createListItem(item, getUrl);
        }
    }
}
function lastestUpdate() {
    // alert('call lastest update');
    fetch('/index/lastest-update', {
        method: 'GET'
    })
    .then(res => res.json())
    .then(data => {
        // alert(data.success);
        // alert(data.success === true);
        if (data.success === true) {
            const top5posts = data.top5posts;
            // alert(top5posts);
            const top5comments = data.top5comments;
            // alert("Update Successfully");
            const top5favorites = data.top5favorites;
            displayListItems(top5posts, 'list-lastest-posts');
            displayListItems(top5comments, 'list-lastest-comments');
            displayListItems(top5favorites, 'list-lastest-favorites');
        }
    })
}

async function getSlug(postId) {
    try {
        const response = await fetch(`/post/${postId}`, {
            method: 'GET'
        });
        const data = await response.json();
        return data.url;
    } catch (error) {
        alert("Error", error);
        return null;
    }
}

////////////// Hàm lấy giá trị từ Filter form //////////////
function filterPost(event) {
    event.preventDefault();
    const cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = `
    <p> loading... </p>`
    ;
    // Get form values
    const mostPopular = document.getElementById('most-popular').checked ? 1 : 0;
    const recentlyAdded = document.getElementById('recently-added').checked ? 1 : 0;
    const category = document.getElementById('category').value;
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    const keywords = document.getElementById('searchKeywords').value;

    // Create query string
    const queryParams = new URLSearchParams({
        most_popular: mostPopular,
        recently_added: recentlyAdded,
        category: category,
        date_from: dateFrom,
        date_to: dateTo,
        key_words: keywords
    }).toString();

    // Make a request to the server
    fetch(`/index/filter-posts?${queryParams}`, {
        method: "POST",
    })  .then(response => response.json())
        .then(data => {
            // Process the filtered data
            console.log('Filtered Posts:', data);
            // Example: Render the posts on the page
            // renderPosts(data);
            searchPost = data.posts;
            showSearchPosts();
        })
        .catch(error => {
            aler("Errror when fetch to server", error);
        });
}
////////////// hàm reset form filter //////////////
function resetFilterPost(event){
    event.preventDefault();
    // Get the form element
    const form = document.querySelector('.filter-form');
    // Reset the form fields to their default values
    form.reset();
}
/*------------------------------------------------------------------ */