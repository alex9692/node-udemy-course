const mongoose = require('mongoose');
 
const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide this subscription a name'],
      unique: true
    },
    duration: {
      type: Number,
      require: [
        true,
        'Please Provide the length of the Subscription in Number of Days Ex: Yearly Subscription shall have duration=364'
      ]
    },
    price: {
      type: Number,
      require: true
    },
    description: { type: String, max: 500 },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'Users',
      required: [true, 'Only Application Admin can Create this..']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
 
const Subscription = mongoose.model('subscription', subscriptionSchema);
 
module.exports = Subscription;