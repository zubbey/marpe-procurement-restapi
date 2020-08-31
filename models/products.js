const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {type: String, required: true, max: 100},
    price: {type: Number, required: true},
    shippingprice: {type: Number},
    weight: {type: Number},
    qtyRange: {type: Number},
    refLink: {type: String},
    thumbnail: {type: String, required: true},
    imageLinks: {type: Array},
    desc: {type: String, required: true, max: 5000},
    label: {type: String, enum: ['Products Available in Our Nigerian Warehouse', 'Products On Preorders',], default: ''},
    status: {type: String, enum: ['In Stock', 'Out Of Stock', 'Reserved'], default: 'In Stock'},
    categoryId: {type: String, required: true},
    slug: { type: String},
    created: {type: Date, default: Date.now()},
    modified: {type: Date}
}, { collection : 'products' });

productSchema.index({name: 'text', categoryId: 'text'}, {default_language: 'none'});
module.exports = mongoose.model('Product', productSchema);