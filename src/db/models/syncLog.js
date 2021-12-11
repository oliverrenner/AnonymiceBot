const mongoose = require("mongoose")

const schema = mongoose.Schema({
	startTime: Date, 
    wasSuccessful: Boolean
})

module.exports = mongoose.model("SyncLog", schema)