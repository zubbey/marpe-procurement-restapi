const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema({
    cart: { type: Object },
    user: { type: Object },
    currency: {type: String, default: 'NGN' },
    reference: {type: String,},
    deliverymethod: { type: String, default: 'Self Pickup' },
    total: { type: Number },
    isShipped: { type: Boolean, default: false},
    date: { type: Date, default: Date.now },
    modified: { type: Date }
}, { collection : 'order' });

module.exports = mongoose.model('Order', OrderSchema);