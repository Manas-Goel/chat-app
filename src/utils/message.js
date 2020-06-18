const generateMessage = (username, text, key) => {
    return {
        username,
        text,
        key,
        createdAt: new Date().getTime()
    };
};

module.exports = {
    generateMessage
}