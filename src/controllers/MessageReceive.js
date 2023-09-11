class MessageReceive {
    async getMessage(req, res) {
        console.log(req.body)
        res.sendStatus(200);
    }
}

module.exports = {
    MessageReceive
}