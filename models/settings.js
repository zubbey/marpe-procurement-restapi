const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');

const settingSchema = mongoose.Schema({
    homebanner: {type: Array},
    commission: {type: Object},
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
    rates: {type: Array},
    created: {type: Date, default: Date.now()},
    modified: {type: Date}
}, { collection : 'settings' });

module.exports = mongoose.model('Settings', settingSchema);