const mongoose = require('mongoose');

const settingSchema = mongoose.Schema({
    homebanner: {type: Array},
    commitions: {type: Object},
    about: {type: Array},
    services: {type: Array},
    faqs: {type: Array},
    terms: {type: Array},
    contact: {type: Array},
    productwebsites: {type: Array},
    shippingmethods: {type: Array},
    currencyType: {type: Object},
    notes: {type: Array},
    socials: {type: Array},
    gallery: {type: Array},
    created: {type: Date, default: Date.now()}
}, { collection : 'settings' });

module.exports = mongoose.model('Settings', settingSchema);