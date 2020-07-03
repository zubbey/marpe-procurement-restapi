const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema({
    cart: { type: Object },
    user: { type: Object },
    amount: { type: Number },
    date: { type: Date, default: Date.now },
    modified: { type: Date }
}, { collection : 'order' });

module.exports = mongoose.model('Order', OrderSchema);