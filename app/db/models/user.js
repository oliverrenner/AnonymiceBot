const mongoose = require("mongoose")

const schema = mongoose.Schema({
	userId: String, //discord user id
	userName: String, //discord user display name
	walletAddress: String, //wallet address used for verification
	lastVerified: Date, // timestamp the user was last verified
	status: Object //for now - will just store whatever data was verified 
})

module.exports = mongoose.model("User", schema)