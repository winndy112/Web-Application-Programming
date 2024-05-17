document.addEventListener('DOMContentLoaded', function () {
    alert("Hello World");
    let params = { postId: window.location.href.split('/')[4].trim() };
    alert(params.postId);
    let url = '/post/api?postId=' + params.postId;
    // Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    // alert(params.postId);
    alert(url);
    fetch(url)
        .then(res => res.json())
        .then(data => {
            alert("HHAA");
            alert(data.post.title);
            let title_page = document.getElementById('title-page');
            title_page.innerText = data.post.title;
        })
        .catch(err => {
            console.log(err);
        });
    // document.getElementById('title-page').innerText = 'New Page Title';
    document.getElementById('heading1').innerText = 'LMAOOOOjaklbdjlavjlnaljkvnalnglanvajnlrgnakldnvlad';
});
// Bấm vô link -> xong hiện ra cái post -> link là gửi request GET luôn -> Get thì trả về data -> khi 