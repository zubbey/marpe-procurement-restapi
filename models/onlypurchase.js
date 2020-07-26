const mongoose = require('mongoose');

const onlyPurchaseSchema = mongoose.Schema({
    useremail: {type: String, required: true},
    sellername: {type: String, required: true},
    amount: {type: Number, required: true},
    sellerphone: {type: Number, required: true},
    total: {type: Number},
    orderPlaced: {type: Boolean, default: false},
    isPaid: {type: Boolean, default: false},
    created: {type: Date, default: Date.now()}
}, { collection : 'onlypurchase' });

module.exports = mongoose.model('Onlypurchase', onlyPurchaseSchema);