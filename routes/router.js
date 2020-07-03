require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Crypto = require('crypto');
const cryptoRandomString = require('crypto-random-string');
const Bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const router = express.Router();
const Category = require('../models/category');
const Product = require('../models/products');
const Cart = require('../models/cart');
const Order = require('../models/order');
const User = require('../models/user');
const Admin = require('../models/admin');

// ################################ CATEGORY ########################################
// Get all Category ENDPOINT
router.get('/category', async (req, res) => {
    try {
        const getCategories = await Category.find().sort({items: -1});
        res.status(200).json(getCategories);
    } catch (error) {
        res.status(404).send({message: error.message});
    }
});

// Create a new Category ENDPOINT
router.post('/category', async (req, res) => {
    const addCategory = new Category({
        categoryName: req.body.categoryName
    });
    try {
        const newCategory = await addCategory.save();
        res.status(201).json(newCategory);

    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Delete a Specific Category
router.delete('/category/:id', async (req, res) => {
    try {
        deleteCategory = await Category.deleteOne({_id: req.params.id});
        res.status(200).json(deleteCategory);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// ################################ PRODUCTS ########################################

router.get('/products/:label', async (req, res) => {
    try {
        const getProducts = await Product.find().sort({created: -1});
        res.status(200).json(getProducts.filter(products => products.label === req.params.label) );
    } catch (error) {
        res.status(404).send({message: error.message});
    }
});

// Get a specific Product
router.get('/product/:slug', async (req, res) => {
    try {
        getProduct = await Product.find({slug: req.params.slug});
        
        res.status(200).json(getProduct);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Add new Product ENDPOINT
router.post('/products', async (req, res) => {
    const addProduct = new Product({
        name: req.body.name,
        price: req.body.price,
        weight: req.body.weight,
        qtyRange: req.body.qtyRange,
        refLink: req.body.refLink,
        thumbnail: req.body.thumbnail,
        imageLinks: req.body.imageLinks,
        desc: req.body.desc,
        label: req.body.label,
        status: req.body.status,
        categoryId: req.body.categoryId,
        slug: "",
        created: new Date()
    });

    try {
        const newProduct = await addProduct.save();

        async function getCategorySlug(cat_id){
            let result = await Category.findOne({_id: cat_id});
            let createSlug = result.slug+'-'+newProduct._id;

            // update Product slug
            await Product.updateOne({_id: newProduct._id}, {$set: {slug: createSlug}});
            // update items in category
            await Category.updateOne({_id: cat_id}, {$inc: {items: 1}});
        }
        getCategorySlug(newProduct.categoryId);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

router.patch('/products/:id', async (req, res) => {
    try {
        const updateProduct = await Product.updateMany({_id: req.params.id}, {
            $set: {
                name: req.body.name,
                price: req.body.price,
                weight: req.body.weight,
                qtyRange: req.body.qtyRange,
                refLink: req.body.refLink,
                thumbnail: req.body.thumbnail,
                imageLinks: req.body.imageLinks,
                desc: req.body.desc,
                label: req.body.label,
                status: req.body.status,
                categoryId: req.body.categoryId,
                slug: "",
                modified: new Date()
            }
        });
        // Get Product to update Slug
        const productId = await Product.findOne({_id: req.params.id});

        async function updateCategorySlug(cat_id){
            let result = await Category.findOne({_id: cat_id});
            let createSlug = result.slug+'-'+productId._id;
            // update Product slug
            await Product.updateOne({_id: productId._id}, {$set: {slug: createSlug}});
            // update items if category has changed
            if (!result._id == cat_id) {
                await Category.updateOne({_id: cat_id}, {$inc: {items: 1}});
            }
        }
        updateCategorySlug(productId.categoryId);
        

        res.status(201).json(updateProduct);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Delete a Specific Product
router.delete('/products/:id', async (req, res) => {
    try {
        deleteProduct = await Product.deleteOne({_id: req.params.id});
        res.status(200).json(deleteProduct);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});


// Add to Cart
router.post('/cart', async (req, res) => {
    const addToCart = new Cart({
        product: req.body.product,
        user: req.body.user,
        qty: req.body.qty,
        addedDate: new Date()
    });

    try {
        const saveToCart = await addToCart.save();
        res.status(201).json(saveToCart);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// get Specific user cart
router.get('/cart/:userid', async (req, res) => {
    try {
        const userCart = await Cart.find({"user._id": req.params.userid}).sort({addedDate: -1});
        res.status(200).json(userCart);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Update Cart
router.patch('/cart/:id', async (req, res) => {
    try {
        const updateItem = await Cart.updateOne({"product._id": req.params.id}, {
            $set: {
                product: req.body.product,
                user: req.body.user,
                qty: req.body.qty,
                modified: new Date()
            }
        });

        res.status(201).json(updateItem);

    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Delete Cart
router.delete('/cart/:id', async (req, res) => {
    try {
        const deleteCartItem = await Cart.deleteOne({"product._id": req.params.id});
        res.status(200).json(deleteCartItem);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Empty a specific user Cart
router.delete('/cart/empty/:user', async (req, res) => {
    try {
        const emptyCart = await Cart.deleteMany({"user._id": req.params.user});
        res.status(200).json(emptyCart);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Post Orders
router.post('/order', async (req, res) => {
    const placeOrders = new Order({
        cart: req.body.cart,
        user: req.body.user,
        amount: req.body.amount,
        date: new Date()
    });

    try {
        const saveOrder = await placeOrders.save();
        res.status(201).json(saveOrder);
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Get all users
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find().sort({created: -1});
        res.status(200).json(users.filter(user => user.email === req.email.email));
    } catch (error) {
        res.status(403).send({message: error.message});
    }
});

router.get('/user/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find().sort({created: -1});
        res.status(200).json(orders.filter(order => order.user.email === req.email.email));
    } catch (error) {
        res.status(403).send({message: error.message});
    }
});

router.patch('/user/info', authenticateToken, async (req, res) => {
    try {
        const updateUserInfo = await User.updateOne({email: req.email.email}, {
            $set: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                phone: req.body.phone,
                address: req.body.address,
                city: req.body.city,
                country: req.body.country,
                zip: req.body.zip,
                shippingaddress: req.body.address,
                modified: new Date()
            }
        });
        res.json(updateUserInfo);
    } catch (error) {
        res.status(403).send({message: error.message});
    }
})

// update user info
router.patch('/user/address', authenticateToken, async (req, res) => {
    try {
        const updateUserAddress = await User.updateOne({email: req.email.email}, {
            $set: {
                address: req.body.address,
                city: req.body.city,
                country: req.body.country,
                zip: req.body.zip,
                shippingaddress: req.body.shippingaddress,
                modified: new Date()
            }
        });
        res.json(updateUserAddress);
    } catch (error) {
        res.status(403).send({message: error.message});
    }
})

// update user password
router.patch('/user/password', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({email: req.email.email});
        if(!Bcrypt.compareSync(req.body.oldpassword, user.password)){
            return res.status(400).send({message: 'The password you entered did not match the record!'})
        }
        const updateUserPassword = await User.updateOne({_id: user._id}, {
            $set: {
                password: Bcrypt.hashSync(req.body.password, 10),
                modified: new Date()
            }
        });
        res.json(updateUserPassword);
    } catch (error) {
        res.status(403).send({message: error.message});
    }
})

// Register a new user
router.post('/users/register', async (req, res) => {
    const user = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone,
        password: Bcrypt.hashSync(req.body.password, 10),
        referralcode: userReferralCode(6),
        isReffered: req.body.isReffered,
        token: userToken(32),
        created: new Date()
    });
    try {      
        const registerUser = await user.save();
        const accessToken = jwt.sign({token: registerUser.token}, process.env.ACCESS_TOKEN_SECRET);  
        res.status(201).json({accessToken: accessToken});
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Login users
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email});
        if(!user){
            return res.status(400).send({message: 'The email address you entered does not exist'})
        }
        if(!Bcrypt.compareSync(req.body.password, user.password)){
            return res.status(400).send({message: 'The password you entered is incorrect!!'})
        }
        const email = {email: req.body.email};
        const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
        res.json({message: 'Login was successfully!', accessToken: accessToken});
    } catch (error) {
        res.status(400).send({message: error.message});
    }
})

// get Affiliate
router.get('/users/affiliate/:referralCode', async (req, res) => {
    try {
        const getAffiliate = await User.findOne({referralcode: req.params.referralCode});
        res.status(200).json(getAffiliate._id);
    } catch (error) {
        res.status(404).send({message: `No user with this (${req.params.referralCode}) Referral Code found!`});   
    }
});

// update Affiliate
router.patch('/users/affiliate/:id', async (req, res) => {
    try {
        const updateAffiliate = await User.updateOne({_id: req.params.id}, {
            $push: {
                affiliates: req.body
            }
        });
        res.json(updateAffiliate);

    } catch (error) {
        res.status(404).send({message: error.message})
    }
});

// Register a new Admin 
router.post('/admin/register', async (req, res) => {
    const admin = new Admin({
        username: req.body.username,
        email: req.body.email,
        password: Bcrypt.hashSync(req.body.password, 10),
        token: userToken(32),
        created: new Date()
    });
    try {      
        const registerAdmin = await admin.save();
        const accessToken = jwt.sign({token: registerAdmin.token}, process.env.ACCESS_TOKEN_SECRET);  
        res.status(201).json({accessToken: accessToken});
    } catch (error) {
        res.status(400).send({message: error.message});
    }
});

// Login Admin
router.post('/admin/login', async (req, res) => {
    try {
        const admin = await Admin.findOne({email: req.body.email});
        if(!admin){
            return res.status(400).send({message: 'The email address you entered does not exist'})
        }
        if(!Bcrypt.compareSync(req.body.password, admin.password)){
            return res.status(400).send({message: 'The password you entered is incorrect!!'})
        }
        if(!admin.isAdmin == true){
            return res.status(403).send({message: 'You don\'t have access to this portal, please stop trying!'})
        }
        const email = {email: req.body.email};
        const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
        res.json({message: 'Login was successfully!', accessToken: accessToken});
    } catch (error) {
        res.status(400).send({message: error.message});
    }
})


router.get('/admin', authenticateToken, async (req, res) => {
    try {
        const admins = await Admin.find().sort({created: -1});
        res.status(200).json(admins.filter(admin => admin.email === req.email.email));
    } catch (error) {
        res.status(403).send({message: error.message});
    }
});

router.get('/admin/data', authenticateToken, async (req, res) => {
    try {
        const admin =  await Admin.findOne({email: req.email.email});
        if(!admin.isAdmin == true){
            return res.status(403).send({message: 'you don\'t have the privilege to make this request'})
        }
        const allUsers = await User.find().sort({created: -1});
        const allProducts = await Product.find().sort({created: -1});
        const allCategory = await Category.find().sort({created: -1});
        res.status(200).json({users: allUsers, products: allProducts, category: allCategory});
    } catch (error) {
        res.status(403).send({message: error.message});
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null || token == '') {return res.status(401).json({message: 'Invalid Access Token'})};

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, email) => {
        if(err) { return res.status(403).json() };
        req.email = email;
        next();
    });
}

function userToken(size){
    return Crypto
    .randomBytes(size)
    .toString('base64')
    .slice(0, size)
}

function userReferralCode(size){
    return cryptoRandomString({length: size, type: 'distinguishable'})
}

module.exports = router;