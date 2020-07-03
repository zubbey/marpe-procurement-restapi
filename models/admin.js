const mongoose = require('mongoose');
const validator = require('validator');
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const adminSchema = mongoose.Schema({
   username: { type: String, required: [true, 'Please enter a username'], unique: true, max: 50, validate: /[a-z]/ },
   firstname: {type: String, default: ''},
   lastname: {type: String, default: ''},
   email: {
        type: String,
        require: [true, 'Please enter your email address'],
        match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, `Please enter a valid email address`],
        validate: {
          validator: function() {
            return new Promise((res, rej) =>{
              Admin.findOne({email: this.email, _id: {$ne: this._id}})
                  .then(data => {
                      if(data) {
                          res(false)
                      } else {
                          res(true)
                      }
                  })
                  .catch(err => {
                      res(false)
                  })
            })
          }, message: 'Email Address Already Taken'
        }
      },
   phone: { type: String,
      validate: {
            validator: function(v) {
               var re = /^\d{11}$/;
               return (v == null || v.trim().length < 1) || re.test(v)
            },
            message: 'Provided phone number is invalid.'
      },
      default: ''
   },
   password: {type: String, min: 8, required: [true, 'Password is required']},
   slug: { type: String, slug: ["username", "_id"], unique: true},
   role: {type: String, enum: ['readonly', 'read/write', 'full-access'], default: 'readonly'},
   isAdmin: {type: Boolean, default: false},
   token: {type: String},
   isVerified: {type: Boolean, default: false},
   created: {type: Date, default: Date.now},
   modified: {type: Date, default: ''}
}, { collection : 'admin' });

Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;