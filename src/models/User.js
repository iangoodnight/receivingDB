/**
 * User model and password methods
 */

'use strict';

const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');
const {
  regex: { isAlphaNumeric },
} = require('../utils');

const SALT_ROUNDS = 10;

const schemaOptions = {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

const userSchema = new Schema(
  {
    email: {
      lowercase: true,
      maxLength: 64,
      required: true,
      trim: true,
      type: String,
      unique: true,
      validate: [
        (email) => {
          //eslint-disable-next-line
          const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
          return re.test(email);
        },
        'Please use a valid email address',
      ],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    name: {
      firstName: {
        maxLength: 32,
        required: true,
        trim: true,
        type: String,
        validate: [isAlphaNumeric, 'Name must be alphanumeric (a-z, -, ., _)'],
      },
      lastName: {
        maxLength: 32,
        required: true,
        trim: true,
        type: String,
        validate: [isAlphaNumeric, 'Name must be alphanumeric (a-z, -, ., _)'],
      },
    },
    password: {
      required: true,
      type: String,
      select: false,
      maxLength: 32,
    },
    resetRequired: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: [String],
      enum: ['ADMIN', 'AUDIT', 'READ', 'WRITE'],
      default: ['READ'],
    },
    username: {
      lowercase: true,
      maxLength: 32,
      required: true,
      trim: true,
      type: String,
      unique: true,
      validate: [
        isAlphaNumeric,
        'Username must be alphanumeric (a-z, -, ., _)',
      ],
    },
  },
  schemaOptions
);

userSchema.pre('save', async function save(next) {
  const user = this;
  // only if hash is modified
  if (!user.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.validatePassword = async function validatePassword(data) {
  return bcrypt.compare(data, this.password);
};

userSchema.statics.login = function login(id /*callback*/) {
  const query = { $set: { lastLogin: Date.now() } };
  const options = { new: true };
  return this.findByIdAndUpdate(id, query, options /* callback*/);
};

const User = model('User', userSchema);

module.exports = User;
