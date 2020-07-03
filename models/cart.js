const mongoose = require('mongoose');

const CartSchema = mongoose.Schema({
    product: {  
        _id: {type: String},
        name: {type: String},
        price: {type: Number},
        slug: {type: String},
        thumbnail: {type: String},
    },
    user: {
        _id: { type: String },
        name: {
            type: String,
            default: 'guest'
        }
    },
    qty: {type: Number, default: 0},
    addedDate: {type: Date, default: Date.now},
    modified: {type: Date}
}, { collection : 'cart' });

module.exports = mongoose.model('Cart', CartSchema);