const Subscription = require('../models/subscription');
const catchAsync = require('../utils/catchAsync');
 
//Creating a New Subscription
exports.createNewSubscription = catchAsync(async (req, res, next) => {
  const newSubscription = await Subscription.create(req.body);
 
  res.status(201).json({
    status: 'success',
    Data: {
      newSubscription
    }
  });
});
 
//Fetaching all Subscription
exports.getAllSubscription = catchAsync(async (req, res, next) => {
  const subscription = await Subscription.find();
  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});