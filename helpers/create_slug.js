const vietnameseToASCII = (str) => {
    const from = "áàạảãâấầậẩẫăắằặẳẵéèẹẻẽêếềệểễíìịỉĩóòọỏõôốồộổỗơớờợởỡúùụủũưứừựửữýỳỵỷỹđ";
    const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";

    return str.split('').map((char, index) => {
        const fromIndex = from.indexOf(char);
        if (fromIndex !== -1) {
            return to[fromIndex];
        }
        return char;
    }).join('');
};

const slugify = require('slugify');
const createSlug = (title) => {
    const asciiTitle = vietnameseToASCII(title);
    return slugify(asciiTitle, {
        replacement: "-", // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match regex, defaults to `undefined`
        lower: true, // convert to lower case, defaults to `false`
    });
};
module.exports = { createSlug };