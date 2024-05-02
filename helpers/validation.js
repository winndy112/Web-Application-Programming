const Joi = require('joi');

const registerValidation = (data) => {
    const registerSchema = Joi.object({
        firstname: Joi.string().min(1).required(),
        lastname: Joi.string().min(1).required(),
        email: Joi.string().min(6).required().email(),
        username: Joi.string().min(6).max(20).required().lowercase(),
        password: Joi.string().min(6).max(32).required()
    });
    return registerSchema.validate(data);
}

const loginValidation = (data) => {
    const loginSchema = Joi.object({
        username: Joi.string().min(6).max(20).required().lowercase(),
        password: Joi.string().min(6).max(32).required()
    });
    return loginSchema.validate(data);
}

module.exports = {
    registerValidation, 
    loginValidation,
}