var currentPage; 
////////////// lắng nghe sự kiện click vào các card post //////////////
function addEventClick() {
    const cards = document.querySelectorAll(".card");
    const listItems = document.querySelectorAll(".list-group-item");
    cards.forEach((card, index) => {
        card.addEventListener("click", async function () {
            const cardid = `postID-${index + 1}`;
            const postIdElement = document.querySelector(`#${cardid}`);
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
document.addEventListener("DOMContentLoaded", async function () {
    // hàm lắng nghe khi nhấn vào các card để hiện modal tương ứng 
    addEventClick();
    currentPage = 1;
    renderPosts(currentPage);// mặc định load trang đầu tiên khi vào trang
});

// kết thúc DOM load
////////////// hàm thêm các nút số trang vào phân trang //////////////
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
////////////// handle khi người dùng click vào các nút số trang //////////////
async function handlePaginationClick(page) {
    currentPage = page;
    await renderPosts(currentPage);
}
////////////// hàm render page được click //////////////
async function renderPosts(page) {
    await get(page);
    // attachEventComment();
}
async function get(page) {
    try {
        // fetch để get 1 bài post trong page được chọn
        const response = await fetch(`/favorite/newsfeed/${page}`, {
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
            const favoritePostsData = data.favoritePostsData;
            const totalPostOfPage = data.totalPostOfPage;
            const paginationContainer = document.querySelector(".pagination");
            if (totalPostOfPage == 0) {
                let paginationEle = document.getElementById('pagination-nav');
                paginationEle.style.display = "none";
                let noPostsFound = document.getElementById('no-posts-found');
                noPostsFound.style.display = "block";
            }
            // nếu đủ link page thì không cần add thêm
            if (favoritePostsData != paginationContainer.querySelectorAll(".page-item").length - 1) {
                addLinkPage(data.total);
            }
            // ẩn tất cả các card post
            for (let i = 1; i <= 4; i++) {  
                const postElement = document.querySelector(`#thePost${i}`);
                postElement.style.display = "none";
            }
            
            for (let i = 0; i < totalPostOfPage; i++) {
                const postIndex = i + 1;
                let post = favoritePostsData[i];
                // cập nhật card post
                let postElement = document.querySelector(`#thePost${postIndex}`);
                postElement.style.display = "block";
                const imageElement = document.querySelector(`#post${postIndex}.card-img-top`);
                const titleElem = document.querySelector(`#postTitle${postIndex}.card-title`);
                const text = document.querySelector(`#postText${postIndex}.card-text`);
                const postID = document.querySelector(`#postID-${postIndex}`);
                postID.textContent = post._id;
                titleElem.textContent = post.title;
                
                text.innerHTML = `
                        <p>Created at: ${convertTimeFormat(post.createdAt)}<br>
                            Likes: ${post.numLikes}
                        </p>
                    `;
                // alert(post.title); debug
                if (post.coverPhoto) 
                    {
                        imageElement.src = "data:image/png;base64," + post.coverPhoto;
                    }
                else {
                    imageElement.src = "/photo/dan-len-hand-made.jpg";
                }
                /*-------------------------------------------------------------------------*/
            }
        } else {
            console.error('Response was not JSON');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}
////////////// chuyển đổi format thời gian //////////////
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

