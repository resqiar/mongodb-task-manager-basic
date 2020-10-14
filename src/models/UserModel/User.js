const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * ! USER SCHEMA !
 */

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value){
            if (!validator.isEmail(value)) throw new Error('Email is invalid')
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value){
            if (value.length < 8) throw new Error('Password minimum characters are 8')
            //if (value.toLowercase.includes('password')) throw new Error('You cannot use this password') 
        }
    },
    age: {
        type: String,
        default: 0,
        validate(value){ // TODO: Validate Data Before Saving It
            if (value < 0) throw new Error('Age must be a positive number')
        }
    },
    jobs: {
        type: String,
        default: "Jobless"
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

//! Methods to generate tokens
userSchema.methods.generateAuthTokens = async function () {
    // generate tokens with JWT
    const token = jwt.sign({ _id: this._id.toString()}, 'resqiar')
    // save it to database
    this.tokens = this.tokens.concat({ token })
    await this.save()

    return token
}

// ! Methods to login with email and Password
userSchema.statics.findByCredentials = async (email, password) => {
    //search user by email 
    const user = await User.findOne({email})

    if (!user) throw new Error('Could not find any data relevant')

    // if true then compare the password
    const isMatch = await bcryptjs.compare(password, user.password)

    if (!isMatch) throw new Error('Password Incorrect')

    return user
}


/**
 * ! Schema Middleware !
 */
userSchema.pre('save', async function(next) {
    // Check if password is created and hash it
    if (this.isModified('password')) this.password = await bcryptjs.hash(this.password, 8)

    // next
    next()
})


/**
 * ! USER MODEL !
 */
const User = mongoose.model('User' ,userSchema)

module.exports = User