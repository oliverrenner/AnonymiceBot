const mongoose = require("mongoose")

const schema = mongoose.Schema({
	userId: String,
	requestId: String,
	url: String,
	ts: Number
})

module.exports = mongoose.model("VerificationRequest", schema)
