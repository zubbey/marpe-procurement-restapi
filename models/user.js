const mongoose = require('mongoose');
const validator = require('validator');
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const userSchema = mongoose.Schema({
   firstname: { type: String, required: [true, 'Please enter your firstname'], max: 50, validate: /[a-z]/ },
   lastname: {type: String, required: [true, 'Please enter your Lastname'], max: 50, validate: /[a-z]/},
   email: {
        type: String,
        require: [true, 'Please enter your email address'],
        match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, `Please enter a valid email address`],
        validate: {
          validator: function() {
            return new Promise((res, rej) =>{
              User.findOne({email: this.email, _id: {$ne: this._id}})
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
   phone: { type: String, required: [true, 'Please enter your Mobile Number'],/*not required by default**/ 
      validate: {
            validator: function(v) {
               var re = /^\d{11}$/;
               return (v == null || v.trim().length < 1) || re.test(v)
            },
            message: 'Provided phone number is invalid.'
      }
   },
   password: {type: String, min: 6, required: [true, 'Password is required']},
   city: {type: String, default: ''},
   country: {type: String, default: ''},
   zip: {type: Number, default: null},
   address: {type: String, default: ''},
   shippingaddress: {type: String, default: ''},
   slug: { type: String, slug: ["firstname", "_id"], unique: true},
   isAdmin: {type: Boolean, default: false},
   referralcode: {type: String},
   isReffered: {type: Object, referred: {type: Boolean, default: false}},
   affiliates: [],
   token: {type: String},
   isVerified: {type: Boolean, default: false},
   created: {type: Date, default: Date.now},
   modified: {type: Date, default: ''}
}, { collection : 'users' });

User = mongoose.model('User', userSchema);
module.exports = User;