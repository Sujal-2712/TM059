const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospital_id: {
    type: Number,
    required: true,
    unique: true,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  hospital_name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});

hospitalSchema.index({ location: '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;
