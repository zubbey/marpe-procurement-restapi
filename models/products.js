const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {type: String, required: true, max: 100},
    price: {type: Number, required: true},
    weight: {type: Number},
    qtyRange: {type: Number},
    refLink: {type: String, required: true},
    thumbnail: {type: String, required: true},
    imageLinks: [String],
    desc: {type: Array, required: true, max: 5000},
    label: {type: String, enum: ['Products Available in Our Nigerian Warehouse', 'Featured Products from 1688',], default: ''},
    status: {type: String, enum: ['In Stock', 'Out Of Stock', 'Reserved'], default: 'In Stock'},
    categoryId: {type: String, required: true},
    slug: { type: String},
    created: {type: Date, default: Date.now()},
    modified: {type: Date}
}, { collection : 'products' });

module.exports = mongoose.model('Product', productSchema);