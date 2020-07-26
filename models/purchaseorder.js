const mongoose = require('mongoose');

const purchaseOrderSchema = mongoose.Schema({
    useremail: {type: String, required: true},
    website: {type: String, required: true},
    image: {type: String},
    productLink: {type: String, required: true},
    unitPrice: {type: Number, required: true},
    qty: {type: Number, required: true},
    productOption: {type: String},
    sellerphone: {type: Number},
    total: {type: Number},
    fee: {type: Number},
    orderPlaced: {type: Boolean, default: false},
    isShipped: { type: Boolean, default: false},
    created: {type: Date, default: Date.now()}
}, { collection : 'purchaseorder' });

module.exports = mongoose.model('Purchaseorder', purchaseOrderSchema);