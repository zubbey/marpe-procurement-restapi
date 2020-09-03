require('dotenv').config();
const fs = require('fs');
const { promisify } = require('util');
const express = require('express');
const mongoose = require('mongoose');
const Crypto = require('crypto');
const cryptoRandomString = require('crypto-random-string');
const Bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const router = express.Router();
const Category = require('../models/category');
const Product = require('../models/products');
const Cart = require('../models/cart');
const Order = require('../models/order');
const User = require('../models/user');
// users request
const Onlypurchase = require('../models/onlypurchase');
const Purchaseorder = require('../models/purchaseorder');
// admin
const Admin = require('../models/admin');
const Settings = require('../models/settings');

// Payemnt
const PayStack = require('paystack-node');
const APIKEY = process.env.SLK_PAYSTACK;
const environment = process.env.NODE_ENV;

const paystack = new PayStack(APIKEY, environment);
// const feesCalculator = new PayStack.Fees();
// const feeCharge = feesCalculator.calculateFor(250000);
// // ############################# config ####################################

// to delete files
const unlinkAsync = promisify(fs.unlink);
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error("Incorrect file");
        error.code = "INCORRECT_FILETYPE";
        return cb(error, false)
    }
    cb(null, true)
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    fileFilter,
    filename: function (req, file, cb) {
        let ext = '';
        // set default extension (if any)
        if (file.originalname.split(".").length > 1) // checking if there is an extension or not.
            ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, Date.now() + ext) //Appending .jpg
    },
    limits: {
        fileSize: 1000000
    }
});
const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/products')
    },
    fileFilter,
    filename: function (req, file, cb) {
        let ext = '';
        // set default extension (if any)
        if (file.originalname.split(".").length > 1) // checking if there is an extension or not.
            ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, Date.now() + ext) //Appending .jpg
    }
});
// purchase shipping
const upload = multer({ storage: storage });

//product uploads destination
const productsUpload = multer({ storage: storage2 });

// ################################ CATEGORY ########################################
// Get all Category ENDPOINT
router.get('/category', async (req, res) => {
    try {
        const getCategories = await Category.find().sort({ items: -1 });
        res.status(200).json(getCategories);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// Create a new Category ENDPOINT
router.post('/category', authenticateToken, async (req, res) => {
    const addCategory = new Category({
        categoryName: req.body.categoryName
    });
    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        const newCategory = await addCategory.save();
        res.status(201).json(newCategory);

    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Delete a Specific Category
router.delete('/category/:id', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        deleteCategory = await Category.deleteOne({ _id: req.params.id });
        res.status(200).json(deleteCategory);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});
// ################################ UPLOAD (IMAGE) ########################################
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const imgFile = await req.file;
        res.json({ file: imgFile });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});
// upload product images
router.post('/product/upload', productsUpload.array('file', 10), async (req, res, next) => {
    const fullUrl = req.protocol + '://' + req.get('host') + '/';
    try {
        let index = req.query.index;
        let id = req.query.id;
        const imgFile = await req.files;

        //check if product already has generated thumbnail
        const product = await Product.findOne({ _id: id });
        if (product.thumbnail == '') {
            //create thumbnails
            sharp(imgFile[0].path).resize(200, 200).toFile('./uploads/products/thumbnails/' + 'thumb_' + imgFile[0].filename, async (err, resizeImage) => {
                if (err) {
                    console.log(err);
                } else {
                    //update database
                    const updateProductImage = await Product.updateOne({ _id: id }, {
                        $push: {
                            imageLinks: fullUrl + imgFile[0].path
                        },
                        $set: {
                            thumbnail: fullUrl + 'uploads/products/thumbnails/' + 'thumb_' + imgFile[0].filename,
                            modified: new Date()
                        }
                    });
                    // get all products
                    const allProducts = await Product.find().sort({ created: -1 });
                    res.json({ file: imgFile, updated: updateProductImage, thumbnail: resizeImage, products: allProducts });
                }
            });
        } else {

            //update database
            const updateProductImage = await Product.updateOne({ _id: id }, {
                $push: {
                    imageLinks: fullUrl + imgFile[0].path
                },
                $set: {
                    modified: new Date()
                }
            });
            // get all products
            const allProducts = await Product.find().sort({ created: -1 });

            res.json({ file: imgFile, updated: updateProductImage, products: allProducts });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// update uploaded product images
router.patch('/product/upload', productsUpload.array('file', 10), async (req, res, next) => {
    const fullUrl = req.protocol + '://' + req.get('host') + '/';

    // QUERY
    let index = req.query.index;
    let id = req.query.id;
    let oldImages = req.query.oldImages;

    // ARRAY FROM IMAGES
    let arrImages = oldImages.split(',');
    arrImages.splice(index, 1);
    try {
        const imgFile = await req.files;
        let image = fullUrl + imgFile[0].path;
        arrImages.push(image);

        //create thumbnails
        sharp(imgFile[0].path).resize(200, 200).toFile('./uploads/products/thumbnails/' + 'thumb_' + imgFile[0].filename, async (err, resizeImage) => {
            if (err) {
                console.log(err);
            } else {
                //update database
                const updateProductImage = await Product.updateOne({ _id: id }, {
                    $set: {
                        imageLinks: arrImages,
                        thumbnail: fullUrl + 'uploads/products/thumbnails/' + 'thumb_' + imgFile[0].filename,
                        modified: new Date()
                    }
                });
                // get all products
                const allProducts = await Product.find().sort({ created: -1 });

                res.json({ file: imgFile, updated: updateProductImage, thumbnail: resizeImage, products: allProducts });
            }
        });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// deleted updated product image
router.delete('/product/upload', async (req, res) => {
    try {
        let imageIndex = req.query.index;
        let id = req.query.id;
        let product = await Product.findOne({ _id: id });
        let image = product.imageLinks.filter((value, index, arr) => arr[index] === arr[imageIndex])

        // get image filename
        let imageString = image.toString();
        let lastIndex = imageString.lastIndexOf('/');
        let filename = imageString.slice(lastIndex, image.toString().length);

        await unlinkAsync('./uploads/products' + filename);
        const deleteProductImage = await Product.updateOne({ _id: id }, {
            $pull: {
                imageLinks: imageString
            }
        });
        // get all products
        const allProducts = await Product.find().sort({ created: -1 });

        res.send({ deleted: deleteProductImage, products: allProducts });
    } catch (error) {
        res.status(404).send({ message: error.message });
    }

})


// ################################ PRODUCTS ########################################
// Search Product
router.get('/products', async (req, res) => {
    try {
        const keyword = req.query.q;
        const getSearchedProducts = await Product.find({ $text: { $search: keyword } }).limit(10);
        res.status(200).json(getSearchedProducts);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
})

router.get('/products/:label', async (req, res) => {
    try {
        const getProducts = await Product.find().sort({ created: -1 });
        res.status(200).json(getProducts.filter(products => products.label === req.params.label));
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// Get a specific Product
router.get('/product/:slug', async (req, res) => {
    try {
        getProduct = await Product.find({ slug: req.params.slug });

        res.status(200).json(getProduct);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Add new Product ENDPOINT
router.post('/products', authenticateToken, async (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + '/';
    const addProduct = new Product({
        name: req.body.name,
        price: req.body.price,
        weight: req.body.weight,
        qtyRange: req.body.qtyRange,
        refLink: req.body.refLink,
        thumbnail: fullUrl + 'uploads/products/thumbnails/thumb_default.png',
        imageLinks: [],
        desc: req.body.desc,
        label: req.body.label,
        status: req.body.status,
        categoryId: req.body.categoryId,
        slug: "",
        created: new Date()
    });

    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        const newProduct = await addProduct.save();

        async function getCategorySlug(cat_id) {
            let result = await Category.findOne({ _id: cat_id });
            let createSlug = result.slug + '-' + newProduct._id;

            // update Product slug
            await Product.updateOne({ _id: newProduct._id }, { $set: { slug: createSlug } });
            // update items in category
            await Category.updateOne({ _id: cat_id }, { $inc: { items: 1 } });
        }
        getCategorySlug(newProduct.categoryId);
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.patch('/products/:id', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        const updateProduct = await Product.updateOne({ _id: req.params.id }, {
            $set: {
                name: req.body.name,
                price: req.body.price,
                weight: req.body.weight,
                qtyRange: req.body.qtyRange,
                refLink: req.body.refLink,
                desc: req.body.desc,
                label: req.body.label,
                status: req.body.status,
                categoryId: req.body.categoryId,
                slug: "",
                modified: new Date()
            }
        });

        // update product Slug

        async function updateCategorySlug(cat_id) {
            let result = await Category.findOne({ _id: cat_id });
            let createSlug = result.slug + '-' + req.params.id;
            // update Product slug
            await Product.updateOne({ _id: req.params.id }, { $set: { slug: createSlug } });
            // update items if category has changed
            if (!result._id == cat_id) {
                await Category.updateOne({ _id: cat_id }, { $inc: { items: 1 } });
            }
        }
        updateCategorySlug(req.body.categoryId);


        res.status(201).json(updateProduct);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Delete a Specific Product
router.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        const deleteProduct = await Product.deleteOne({ _id: req.params.id });
        if (deleteProduct) {
            const allProducts = await Product.find().sort({ created: -1 });
            res.status(200).json({ deleted: deleteProduct, products: allProducts });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});


// Add to Cart
router.post('/cart', async (req, res) => {
    const addToCart = new Cart({
        product: req.body.product,
        user: req.body.user,
        qty: req.body.qty,
        totalprice: req.body.totalprice,
        addedDate: new Date()
    });

    try {
        const saveToCart = await addToCart.save();
        res.status(201).json(saveToCart);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// get Specific user cart
router.get('/cart/:userid', async (req, res) => {
    try {
        const userCart = await Cart.find({ "user._id": req.params.userid }).sort({ addedDate: -1 });
        res.status(200).json(userCart);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// get userCart
router.get('/user/cart', authenticateToken, async (req, res) => {
    try {
        const usersCart = await Cart.find({ "user.email": req.email.email }).sort({ addedDate: -1 });
        res.status(200).json(usersCart);
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});

// Update Cart
router.patch('/cart/:id', async (req, res) => {
    let action = req.query.q;
    try {
        if (action === 'increment') {
            const incItem = await Cart.updateOne({ _id: req.params.id }, {
                $inc: { qty: 1 },
                $set: {
                    modified: new Date()
                }
            });
            if (incItem) {
                let cart = await Cart.find({ _id: req.params.id });
                await Cart.updateOne({ _id: req.params.id }, {
                    $set: {
                        totalprice: cart[0].totalprice * cart[0].qty
                    }
                });
                res.status(201).json(incItem);
            };
        } else if (action === 'decrement') {
            const decItem = await Cart.updateOne({ _id: req.params.id }, {
                $inc: { qty: -1 },
                $set: {
                    modified: new Date()
                }
            });
            if (decItem) {
                let cart = await Cart.find({ _id: req.params.id });
                await Cart.updateOne({ _id: req.params.id }, {
                    $set: {
                        totalprice: cart[0].totalprice * cart[0].qty
                    }
                });
                res.status(201).json(decItem);
            };
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Delete Cart
router.delete('/cart/:id', async (req, res) => {
    try {
        const deleteCartItem = await Cart.deleteOne({ "product._id": req.params.id });
        res.status(200).json(deleteCartItem);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Empty a specific user Cart
router.delete('/cart/empty/:user', async (req, res) => {
    try {
        const emptyCart = await Cart.deleteMany({ "user._id": req.params.user });
        res.status(200).json(emptyCart);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// textPayment
router.post('/testpayment', async (req, res) => {

})

router.post('/verifypayment', async (req, res) => {

    const verifyTrans = paystack.verifyTransaction({
        reference: req.body.reference
    })
    verifyTrans.then(async function (response) {
        if (response.body.data.status === 'success') {
            console.log('successful!');
        }
        res.json(response.body);
    }).catch(function (error) {
        // deal with error
        res.send({ message: error.message });
        console.log(response.body);
    })
})

// Post Orders
router.post('/initializetransaction', async (req, res) => {

    const orderPayment = paystack.initializeTransaction({
        reference: generateRef(),
        amount: (req.body.total * 100),
        email: req.body.user.email,
        currency: req.body.currency,
    })

    orderPayment.then(function (response) {
        res.status(200).json(response.body);
    }).catch(function (error) {
        res.send({ message: error.message });
        // deal with error
    })
});

// Domestic Post Orders
router.post('/order/domestic', async (req, res) => {
    const placeDomestic = new Order({
        cart: req.body.cart,
        user: req.body.user,
        currency: req.body.currency,
        reference: req.body.reference,
        deliverymethod: req.body.deliverymethod,
        total: req.body.total,
        date: new Date()
    });
    try {
        const saveDomestic = await placeDomestic.save();
        res.status(200).json(saveDomestic);
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});

// Get all users
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find().sort({ created: -1 });
        res.status(200).json(users.filter(user => user.email === req.email.email));
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});

router.get('/user/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find().sort({ created: -1 });
        res.status(200).json(orders.filter(order => order.user.email === req.email.email));
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});

router.patch('/user/info', authenticateToken, async (req, res) => {
    try {
        const updateUserInfo = await User.updateOne({ email: req.email.email }, {
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
        res.status(403).send({ message: error.message });
    }
})

// update user info
router.patch('/user/address', authenticateToken, async (req, res) => {
    try {
        const updateUserAddress = await User.updateOne({ email: req.email.email }, {
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
        res.status(403).send({ message: error.message });
    }
})

// update user password
router.patch('/user/password', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.email.email });
        if (!Bcrypt.compareSync(req.body.oldpassword, user.password)) {
            return res.status(400).send({ message: 'The password you entered did not match the record!' })
        }
        const updateUserPassword = await User.updateOne({ _id: user._id }, {
            $set: {
                password: Bcrypt.hashSync(req.body.password, 10),
                modified: new Date()
            }
        });
        res.json(updateUserPassword);
    } catch (error) {
        res.status(403).send({ message: error.message });
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
        const accessToken = jwt.sign({ token: registerUser.token }, process.env.ACCESS_TOKEN_SECRET);
        res.status(201).json({ accessToken: accessToken });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Login users
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).send({ message: 'The email address you entered does not exist' })
        }
        if (!Bcrypt.compareSync(req.body.password, user.password)) {
            return res.status(400).send({ message: 'The password you entered is incorrect!!' })
        }
        const email = { email: req.body.email };
        const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
        res.json({ message: 'Login was successfully!', accessToken: accessToken });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
})

// get Affiliate
router.get('/users/affiliate/:referralCode', async (req, res) => {
    try {
        const getAffiliate = await User.findOne({ referralcode: req.params.referralCode });
        res.status(200).json(getAffiliate._id);
    } catch (error) {
        res.status(404).send({ message: `No user with this (${req.params.referralCode}) Referral Code found!` });
    }
});

// update Affiliate
router.patch('/users/affiliate/:id', async (req, res) => {
    try {
        const updateAffiliate = await User.updateOne({ _id: req.params.id }, {
            $push: {
                affiliates: req.body
            }
        });
        res.json(updateAffiliate);

    } catch (error) {
        res.status(404).send({ message: error.message })
    }
});

// Purchase and Orders
router.post('/users/purchaseorder', async (req, res) => {
    const addPurchaseOrder = new Purchaseorder({
        useremail: req.body.useremail,
        website: req.body.website,
        image: req.body.image,
        productLink: req.body.productLink,
        unitPrice: req.body.unitPrice,
        qty: req.body.qty,
        productOption: req.body.productOption,
        sellerphone: req.body.sellerphone,
        total: req.body.total,
        fee: req.body.fee,
        orderPlaced: true,
        created: new Date()
    });
    try {
        const savePurchaseOrder = await addPurchaseOrder.save();
        res.status(201).json([savePurchaseOrder]);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Get Purchase Orders
router.get('/user/purchaseorder', authenticateToken, async (req, res) => {
    try {
        const purchaseOrders = await Purchaseorder.find().sort({ created: -1 });
        res.status(200).json(purchaseOrders.filter(order => order.useremail === req.email.email));
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});
router.patch('/user/purchaseorder/:id', authenticateToken, async (req, res) => {

    try {
        const userPurchaseOrders = await Purchaseorder.find();
        if (!userPurchaseOrders.filter(order => order.useremail === req.email.email)) {
            return res.status(404).json({ message: 'no purchase order found for this user' })
        }
        await Purchaseorder.updateOne({ _id: req.params.id }, {
            $set: {
                total: req.body.total,
                orderPlaced: true,
            }
        });
        res.status(200).json({ message: 'Updated' });
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});
router.delete('/user/purchaseorder/:id', authenticateToken, async (req, res) => {
    try {
        const userPurchaseOrders = await Purchaseorder.find();
        if (!userPurchaseOrders.filter(order => order.useremail === req.email.email)) {
            return res.status(404).json({ message: 'no purchase order found for this user' })
        }
        deletePurchaseOrder = await Purchaseorder.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Deleted' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});
// Only Purchase Orders
router.post('/users/onlypurchase', authenticateToken, async (req, res) => {
    const addOnlyPurchase = new Onlypurchase({
        useremail: req.body.useremail,
        sellername: req.body.sellername,
        amount: req.body.amount,
        sellerphone: req.body.sellerphone,
        total: req.body.total,
        orderPlaced: true,
        isPaid: true,
        created: new Date()
    });
    try {
        const saveOnlyPurchase = await addOnlyPurchase.save();
        res.status(201).json(saveOnlyPurchase);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Get Only Purchase
router.get('/user/onlypurchase', authenticateToken, async (req, res) => {
    try {
        const onlyPurchase = await Onlypurchase.find().sort({ created: -1 });
        res.status(200).json(onlyPurchase.filter(order => order.useremail === req.email.email));
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// Get all only payment
router.get('/user/onlypayment', authenticateToken, async (req, res) => {
    try {
        const onlyPayment = await Onlypayment.find().sort({ created: -1 });
        res.status(200).json(onlyPayment.filter(order => order.useremail === req.email.email));
        // res.status(200).json(onlyPayment)
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// Place Only Purchase Order
router.patch('/user/onlypurchase/:id', authenticateToken, async (req, res) => {
    // Onlypurchase

    try {
        const userOnlyPurchase = await Onlypurchase.find();
        if (!userOnlyPurchase.filter(order => order.useremail === req.email.email)) {
            return res.status(404).json({ message: 'no purchase order found for this user' })
        }
        await Onlypurchase.updateOne({ _id: req.params.id }, {
            $set: {
                total: req.body.total,
                orderPlaced: true,
            }
        });
        res.status(200).json({ message: 'Updated' });
    } catch (error) {
        res.status(403).send({ message: error.message });
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
        const accessToken = jwt.sign({ token: registerAdmin.token }, process.env.ACCESS_TOKEN_SECRET);
        res.status(201).json({ accessToken: accessToken });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

// Login Admin
router.post('/admin/login', async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.body.email });
        if (!admin) {
            return res.status(400).send({ message: 'The email address you entered does not exist' })
        }
        if (!Bcrypt.compareSync(req.body.password, admin.password)) {
            return res.status(400).send({ message: 'The password you entered is incorrect!!' })
        }
        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'You don\'t have access to this portal, please stop trying!' })
        }
        const email = { email: req.body.email };
        const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
        res.json({ message: 'Login was successfully!', accessToken: accessToken });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});


router.get('/admin', authenticateToken, async (req, res) => {
    try {
        const admins = await Admin.find().sort({ created: -1 });
        res.status(200).json(admins.filter(admin => admin.email === req.email.email));
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});

router.get('/admin/data', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.email.email });
        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        const allUsers = await User.find().sort({ created: -1 });
        const allProducts = await Product.find().sort({ created: -1 });
        const allCategory = await Category.find().sort({ created: -1 });
        const allCarts = await Cart.find().sort({ created: -1 });
        const allOrders = await Order.find().sort({ created: -1 });
        const allPurchaseOnly = await Onlypurchase.find().sort({ created: -1 });
        const allPurchaseShipping = await Purchaseorder.find().sort({ created: -1 });
        res.status(200).json({
            users: allUsers,
            products: allProducts,
            category: allCategory,
            carts: allCarts,
            orders: allOrders,
            onlyPurchase: allPurchaseOnly,
            purchaseShipping: allPurchaseShipping
        });
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});

// update Shipment Orders
router.patch('/admin/order/:id', async (req, res) => {

    try {
        // const admin = await Admin.findOne({ email: req.email.email });
        // if (!admin.isAdmin == true) {
        //     return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        // }
        await Order.updateOne({ _id: req.params.id }, {
            $set: {
                isShipped: true,
            }
        });
        const updatedOrder = await Order.find().sort({ created: -1 });
        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(403).send({ message: error.message });
    }
});

// Settings 
router.post('/admin/settings', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        const addSettings = new Settings({
            homebanner: req.body.homebanner,
            commitions: req.body.commitions,
            about: req.body.about,
            services: req.body.services,
            faqs: req.body.faqs,
            terms: req.body.terms,
            contact: req.body.contact,
            productwebsites: req.body.productwebsites,
            shippingmethods: req.body.shippingmethods,
            currencyType: req.body.currencyType,
            notes: req.body.notes,
            socials: req.body.socials,
            gallery: req.body.gallery,
            created: new Date()
        });

        await addSettings.save();
        res.status(201).json({ message: 'OK' });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.get('/settings', async (req, res) => {
    try {
        const allSettings = await Settings.find();
        res.status(200).json(allSettings);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

router.patch('/settings/currency', async (req, res) => {
    try {
        let newCurrency = req.query.new;
        let currentCurrency = req.query.current;

        const changeCurrentCurrency = await Settings.updateOne({ 'currencyType.currency': currentCurrency }, {
            '$set': {
                'currencyType.$.default': false
            }
        });
        if (changeCurrentCurrency) {
            await Settings.updateOne({ 'currencyType.currency': newCurrency }, {
                '$set': {
                    'currencyType.$.default': true
                }
            });
            const updatedCurrency = await Settings.findOne();
            res.status(200).json(updatedCurrency.currencyType.filter(currency => currency.default === true));
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// UPDATE GENERAL SETTINGS 1
router.patch('/settings/general1', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        const updateGeneralSettings1 = await Settings.updateOne({}, {
            $set: {
                productwebsites: req.body.productwebsites,
                shippingmethods: req.body.shippingmethods,
                notes: req.body.notes,
                socials: req.body.socials,
                modified: new Date()
            }
        });
        res.send({ updated: updateGeneralSettings1 })
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// UPDATE GENERAL SETTINGS 1
router.patch('/settings/general2', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findOne({ email: req.email.email });

        if (!admin.isAdmin == true) {
            return res.status(403).send({ message: 'you don\'t have the privilege to make this request' })
        }
        
        const updateGeneralSettings2 = await Settings.updateOne({}, {
            $set: {
                rates: req.body.rates,
                commission: req.body.commission,
                modified: new Date()
            }
        });
        res.send({ updated: updateGeneralSettings2 })
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});
// image middleware verify
router.use((err, req, res, next) => {
    if (err.code === "INCORRECT_FILETYPE") {
        res.status(422).json({ error: "only images are allowed" });
        return;
    }
    if (err.code === "LIMIT_FILE_SIZE") {
        res.status(422).json({ error: "allowed file size is 1MB" });
        return;
    }
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null || token == '') { return res.status(401).json({ message: 'Invalid Access Token' }) };

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, email) => {
        if (err) { return res.status(403).json() };
        req.email = email;
        next();
    });
}

function userToken(size) {
    return Crypto
        .randomBytes(size)
        .toString('base64')
        .slice(0, size)
}

function userReferralCode(size) {
    return cryptoRandomString({ length: size, type: 'distinguishable' })
}

function generateRef() {
    return invoiceGen = cryptoRandomString({ length: 15, type: 'base64' });
}

//Paystack middleware
router.use(async function verifications(req, res, next) {
    let responseBVN = await paystack.resolveBVN({
        bvn: req.body.bvn //'22283643840404'
    })

    let responseAcctNum = await paystack.resolveAccountNumber({
        account_number: req.body.acc_num, // '0004644649'
        bank_code: req.body.bank_code // '075'
    })

    next()
})


module.exports = router;