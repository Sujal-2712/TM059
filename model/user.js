const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) throw new Error("Invalid Email");
        },
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    requestData: {
        request:{
            locations: {
                type: [String],
                default:null,
            },
            symptoms: {
                type: [[String]],
                default: null,
            },
        }
        
    },
});

const User = new mongoose.model("UserReg", userSchema);

module.exports = User;
