const mongoose = require("mongoose")

const schema = mongoose.Schema({
	userId: String
	//todo: add the rest of the schema needed
})

module.exports = mongoose.model("User", schema)