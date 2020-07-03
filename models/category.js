const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const productCategory = mongoose.Schema({
    categoryName: {type: String, require: true, max: 100},
    slug: { type: String, slug: "categoryName", unique: true},
    items: {type: Number, default: 0},
    created: {type: Date, default: Date.now()}
}, { collection : 'categories' });

module.exports = mongoose.model('Category', productCategory);