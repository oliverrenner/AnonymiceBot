const mongoose = require("mongoose")

const schema = mongoose.Schema({
	userId: { type: String, index: true}, //discord user id
	userName: String, //discord user display name
	walletAddress: { type: String, index: true}, //wallet address used for verification
	lastVerified: Date, // timestamp the user was last verified
	status: Object //for now - will just store whatever data was verified 
})

module.exports = mongoose.model("User", schema)