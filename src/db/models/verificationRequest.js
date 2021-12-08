const mongoose = require("mongoose")

const schema = mongoose.Schema({
	userId: String, //discord user id
	requestId: String, //unique verification request id
	url: String, //url of the page used to generate the verification request
	ts: Number, // timestamp the verification request was generated
	completed: Boolean //status of the verification request
})

module.exports = mongoose.model("VerificationRequest", schema)
