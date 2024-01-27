const express = require('express');
const db = require('../config/DBConfig');
const { QueryTypes } = require('sequelize');
const session = require('express-session');
const bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
const e = require('connect-flash');
const multer = require('multer');
const uniqid = require('uniqid');
const STRIPE_PUBLISHER_KEY = 'pk_test_51K5RxAFEICFAuBl4SbdshvQfW8NDvIrtDDjNY75iVT06Ydw3FRe4LYxEQ2koyfH0W2Nfn1f4pXh0oLg56QwsDGEU00jf0demEn';
const STRIPE_SECRET_KEY = 'sk_test_51K5RxAFEICFAuBl4JKioqzqeIOpHSTjEITT0VlwJYVuzC32om8595eNgTfehHhnQLgjjSWSvjC7UvLNGUECKSOYs005FOA01Pe';
const stripe = require('stripe')(STRIPE_SECRET_KEY);
const user = require('../models/User');
const admin = require('../models/Admin');
const Product = require('../models/Product');
const Material = require('../models/Material');
const Donations = require('../models/Donations');
const DiscountCodes = require('../models/DiscountCodes');
const FAQ = require('../models/FAQ');
const tickets = require('../models/Contact_Tickets');
const Order = require('../models/Order');
const User = require('../models/User');
const router = express.Router();

const generateDiscountCode = async () => {
  while (true) {
    var result = '';
    var characters = 'ABCDEFGHJKMNOPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength));
    }
    const found = await DiscountCodes.findOne({ where: { DiscountCode: result } });
    if (!found)
      return result;
  }
}
var sessionOption = {
  secret: 'secretkey',
  cookie: {},
  resave: true,
  saveUninitialized: true
};
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    let name = file.originalname;
    let ext = name.substr(name.lastIndexOf('.') + 1, name.length);
    let unique = uniqid();
    cb(null, unique + '.' + ext);
  },
});
const upload = multer({ storage: storage });
router.use(session(sessionOption));
/*== Helper Functions ==*/
function isFutureDate(value) {
  d_now = new Date();
  d_inp = new Date(value);
  return d_now.getTime() <= d_inp.getTime();
}
function getRandomId() {
  var random = new Date().valueOf();
  return random.toString();
}
function verify_user(email) {
  var updated = true;
  const user_found = user.findOne({ where: { email: email } });
  if (user_found) {
    var update_status = {
      is_active: true,
    };
    user
      .update(update_status, { where: { email: email } })
      .then(function () { })
      .catch(async function (err) {
        updated = false;
      });
  }
  return updated;
}
function sendMail(mailTo, subject, message, attachments) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'blisstan3@gmail.com',
      pass: 'Zombiemama0709',
    },
  });
  var mailOptions = {
    from: 'blisstan3@gmail.com',
    to: mailTo,
    subject: subject,
    html: message,
    attachments: attachments
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ');
    }
  });
}
function checkOptions(product) {
  product.blackColour = product.Colour.search('Black') >= 0 ? 'checked' : '';
  product.whiteColour = product.Colour.search('White') >= 0 ? 'checked' : '';
  product.redColour = product.Colour.search('Red') >= 0 ? 'checked' : '';
  product.goldColour = product.Colour.search('Gold') >= 0 ? 'checked' : '';
  product.sixtyfourStorage = product.Storage.search('64GB') >= 0 ? 'checked' : '';
  product.twofivesixStorage = product.Storage.search('256GB') >= 0 ? 'checked' : '';
  product.onetwoeightStorage = product.Storage.search('128GB') >= 0 ? 'checked' : '';
}
/*== View ==*/
router.get('/', (req, res) => {
  if (req.session.user) {
    res.render('index', { title: 'Bliss', isLogin: true });
  } else {
    res.render('index', { title: 'Bliss' });
  }
});
router.get('/estimate/:id', async (req, res) => {
  var product_data = await Product.findOne({ where: { id: req.params.id } });
  res.render('estimate', {
    title: 'Enter Your Measurements',
    productData: product_data
  })
});
router.post('/api/enablemeasurement', (req, res) => {
  req.session.measurements = { length: req.body.length, waist: req.body.waist, bust: req.body.bust, shoulder: req.body.shoulder };
  res.send({ success: true });
});
router.get('/api/getmeasurement', (req, res) => {
  if (req.session.measurements) {
    const measurements = req.session.measurements;
    req.session.measurements = undefined;
    res.send(measurements);
  } else {
    res.send(undefined);
  }
});
router.get('/products/:id', async (req, res) => {
  var product_data = await Product.findOne({ where: { id: req.params.id } });
  var extra_price = await db.query("SELECT * FROM `Material`", { type: QueryTypes.SELECT });

  console.log(extra_price);
  console.log(extra_price[0].Name);

  if (req.session.user) {
    res.render('productinfo', {
      isLogin: true,
      title: 'ProductDetail',
      productData: product_data,
      extraPrice: extra_price,
    });
  } else {
    res.render('productinfo', {
      title: 'ProductDetail',
      productData: product_data,
      extraPrice: extra_price,
    });
  }
});
router.get('/login', (req, res) => {
  if (req.query.email) {
    var verified = verify_user(req.query.email);
    if (verified) {
      res.render('user/login', {
        success: 'success',
        msg: 'User Verified Successfully',
        title: 'Login Your Account',
      });
    } else {
      res.render('user/login', {
        fail: 'fail',
        msg: 'User Verification failed',
        title: 'Login Your Account',
      });
    }
  } else {
    res.render('user/login', { title: 'Login Your Account' });
  }
});

router.get('/verifyotp', (req, res) => {


  res.render('user/verifyotp', {
    success: 'success',
    msg: 'User Verified Successfully',
    title: 'Verify OTP',
  });



});


router.get('/logout', (req, res) => {
  req.session.user = false;
  req.session.cart = [];
  res.redirect('/');
});
router.get('/register', (req, res) => {
  res.render('user/register', { title: 'Register Your Account' });
});
router.get('/forgot-password', (req, res) => {
  res.render('user/forget-password', { title: 'Forgot Password' });
});
router.get('/reset-password', (req, res) => {
  res.render('user/new-password');
});
router.get('/profile', async (req, res) => {
  if (req.session.user) {
    var user_id = req.session.user;
    var user_data = await user.findOne({ where: { id: user_id } });
    let data = {
      title: 'Profile',
      first_name: user_data.first_name,
      last_name: user_data.last_name,
      dob: user_data.date_of_birth,
      address: user_data.address,
      email: user_data.email,
      password: user_data.password,
      isLogin: true,
    };
    if (user_data.profile_pic !== null && user_data.profile_pic !== '') {
      data.profile_pic = user_data.profile_pic;
    }
    res.render('user/profile', data);
  } else {
    res.render('index', {
      isLogin: false,
      msg: 'Please Login to Access this Page',
      title: 'Bliss',
    });
  }
});
router.get('/contact-tickets', (req, res) => {
  if (req.session.user) {
    tickets
      .findAll({ where: { user_id: req.session.user }, group: ['tickets.ticket_no'] })
      .then(function (tickets_data) {
        res.render('user/contact-tickets', {
          tickets_data: tickets_data,
          isLogin: true,
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.render('user/login', {
      isLogin: false,
      fail: 'fail',
      msg: 'Please Login to Access this Page',
      title: 'Bliss',
    });
  }
});
router.get('/ticket-view-messages', async (req, res) => {
  if (req.session.user) {
    let foundUser = await user.findOne({ where: { id: req.session.user } });
    let name = foundUser.dataValues.first_name + ' ' + foundUser.dataValues.last_name;
    var ticket_no = req.query.tid;
    tickets
      .findAll({ where: { ticket_no: ticket_no } })
      .then(function (ticket_data) {
        res.render('user/ticket-view-messages', {
          subject: ticket_data[0].subject,
          ticket_no: ticket_no,
          ticket_data: ticket_data,
          isLogin: true,

          name: name,
        });
      })
      .catch(function (err) {
        return err;
      });
  }
});

router.get('/donatematerial', async (req, res) => {

  if (req.session.user) {
    Material.findAll()
      .then((material) => {
        res.render('donatematerial', { title: 'Donate Material', material: material, isLogin: true });
      })
      .catch((err) => console.log(err));
  } else {
    //res.render('donatematerial', { title: 'Donate Material' });
    res.render('user/login', {
      isLogin: false,
      fail: 'fail',
      msg: 'Please Login to Access this Page',
      title: 'Bliss',
    });
  }
});




router.get('/contact', (req, res) => {
  if (req.session.user) {
    var tid = '';
    if (req.query.tid) {
      tid = req.query.tid;
    } else {
      tid = getRandomId();
    }
    res.render('user/contact', {
      isLogin: true,
      tid: tid,
    });
  } else {
    res.render('user/login', {
      isLogin: false,
      fail: 'fail',
      msg: 'Please Login to Access this Page',
      title: 'Bliss',
    });
  }
});
router.get('/faq', (req, res) => {
  FAQ.findAll()
    .then(function (faq_data) {
      if (req.session.user) {
        res.render('faq', {
          title: 'FAQ',
          isLogin: true,
          faq_data: faq_data,
        });
      } else {
        res.render('faq', {
          title: 'FAQ',
          faq_data: faq_data,
        });
      }
    })
    .catch(function (err) {
      return err;
    });
});
router.get('/shopping-cart', async (req, res) => {
  if (req.session.user) {
    const u = await User.findOne({ where: { id: parseInt(req.session.user) } });
    const cartProducts = req.session.cart;
    let discount = u.GiveDiscount;
    if (cartProducts == undefined || cartProducts == '' || cartProducts.length <= 0) {
      discount = false;
    }
    res.render('cartoverview', {
      title: 'Shopping Cart',
      isLogin: true,
      GiveDiscount: discount
    });
  } else {
    res.render('cartoverview', {
      title: 'Shopping Cart',
    });
  }
});
router.get('/discountcodes', async (req, res) => {
  if (req.session.user) {
    const c = await DiscountCodes.findAll({ where: { UserID: parseInt(req.session.user), IsClaimed: false }, order: [['IsClaimed', 'ASC']] });
    res.render('user/discount-codes', {
      title: 'Discount Codes',
      isLogin: true,
      discountCodes: [...c]
    });
  } else {
    res.render('user/login', {
      isLogin: false,
      fail: 'fail',
      msg: 'Please Login to Access this Page',
      title: 'Bliss',
    });
  }
});
router.get('/proceedpayment', async (req, res) => {
  if (req.session.user) {
    const u = await User.findOne({ where: { id: parseInt(req.session.user) } });
    const cartProducts = req.session.cart;
    let discount = u.GiveDiscount;
    if (cartProducts == undefined || cartProducts == '' || cartProducts.length <= 0) {
      discount = false;
    }
    res.render('shopping-cart', {
      title: 'Shopping Cart',
      isLogin: true,
      GiveDiscount: discount
    });
  } else {
    res.render('shopping-cart', {
      title: 'Shopping Cart',
    });
  }
});




router.get('/Products', (req, res) => {
  if (req.session.user) {
    res.render('products', {
      isLogin: true,
      title: 'Products',
    });
  } else {
    res.render('products', {
      title: 'Products',
    });
  }
});

router.get('/orders', (req, res) => {
  if (req.session.user) {
    Order.findAll({ where: { order_user_id: req.session.user } })
      .then((orders) => {
        let totalOrders = orders.length;
        let totalSpent = 0;
        orders.forEach(function (v, i) {
          totalSpent += parseFloat(v.TotalPrice);
        });

        res.render('user/orders', {
          orders: orders,
          totalOrders: totalOrders,
          totalSpent: totalSpent,
          isLogin: true,
        });
      })
      .catch((err) => console.log(err));
  } else {
    res.redirect('/');
  }
});

router.get('/admin/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login' });
});
router.get('/admin/donations', async (req, res) => {
  if (req.session.admin) {
    await user
      .findAll()
      .then(async function (user_data) {
        const donations = await Donations.findAll();
        res.render('admin/admin-donations', {
          user_data: user_data,
          donations: donations,
          isLoginAdmin: true,
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.redirect('login');
  }
});
router.get('/admin/dashboard', async (req, res) => {
  if (req.session.admin) {
    await user
      .findAll()
      .then(function (user_data) {
        console.log(user_data);
        res.render('admin/admin-dashboard', {
          user_data: user_data,
          isLoginAdmin: true,
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.redirect('login');
  }
});
//Reports
router.get('/admin/reports', async (req, res) => {
  if (req.session.admin) {
    await user
      .findAll()
      .then(function (user_data) {
        res.render('admin/reports', {
          user_data: user_data,
          isLoginAdmin: true,
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.redirect('login');
  }
});

router.post('/api/delMaterial', (req, res) => {
  if (req.session.admin) {
    Material.destroy({ where: { id: parseInt(req.body.id) } })
      .then((d) => {
        res.send({ success: true });
      }).catch((error) => {
        res.send({ success: false });
      });
  }
});
router.get('/admin/inventory', async (req, res) => {
  if (req.session.admin) {
    var materials = await db.query("SELECT id, Name, ExtraPrice ,Popularity ,Qunatity , (CASE WHEN Qunatity<500 THEN 'Low on Material' ELSE NULL END ) AS lowonmaterial FROM material;", { type: QueryTypes.SELECT });
    await user
      .findAll()
      .then(function (user_data) {
        res.render('admin/inventory', {
          user_data: user_data,
          isLoginAdmin: true,
          materials: materials
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.redirect('login');
  }
});

router.get('/admin/editmaterial/:id', async (req, res) => {

  var material = await db.query(`SELECT * FROM material Where id=${req.params.id};`, { type: QueryTypes.SELECT });
  console.log(material);
  if (req.session.admin) {
    await user
      .findAll()
      .then(function (user_data) {
        res.render('admin/editmaterial', {
          user_data: user_data,
          isLoginAdmin: true,
          material: material
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.redirect('login');
  }
});























router.get('/admin/addmaterial', async (req, res) => {
  if (req.session.admin) {
    await user
      .findAll()
      .then(function (user_data) {
        res.render('admin/addmaterial', {
          user_data: user_data,
          isLoginAdmin: true,
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.redirect('login');
  }
});












router.get('/admin/msg', (req, res) => {
  if (req.session.admin) {
    tickets
      .findAll({ group: ['tickets.ticket_no'] })
      .then(function (ticket_data) {
        res.render('admin/admin-contact-messages', {
          tickets_data: ticket_data,
          isLoginAdmin: true,
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
    res.redirect('login');
  }
});
router.get('/admin/product/add', (req, res) => {
  if (req.session.admin) {
    res.render('product/addProduct');
  } else {
    res.render('admin/login');
  }
});
router.get('/admin/product/list', (req, res) => {
  Product.findAll({
    order: [['Brand', 'ASC']],
    raw: true,
  })
    .then((products) => {
      res.render('product/listProducts', {
        products: products,
      });
    })
    .catch((err) => console.log(err));
});
router.get('/admin/faq/add', (req, res) => {
  if (req.session.admin) {
    res.render('admin/faq');
  } else {
    res.render('admin/login', { fail: 'Fail', msg: 'Please login First' });
  }
});
router.get('/admin/faq/edit/:id', async (req, res) => {
  if (req.session.admin) {
    let id = req.params.id;
    await FAQ.findOne({ where: { id: id } })
      .then(function (faq) {
        res.render('admin/edit-faq', {
          question: faq.dataValues.question,
          answer: faq.dataValues.answer,
          id: faq.dataValues.id,
        });
      })
      .catch(function (err) { });
  } else {
    res.render('admin/login', { fail: 'Fail', msg: 'Please login First' });
  }
});
router.get('/admin/faq/list', (req, res) => {
  if (req.session.admin) {
    FAQ.findAll({
      raw: true,
    })
      .then((faq) => {
        res.render('admin/listfaq', {
          faqs: faq,
        });
      })
      .catch((err) => console.log(err));
  } else {
  }
});
router.get('/admin/update-user', async (req, res) => {
  if (req.session.admin) {
    var id = req.query.id;
    await user
      .findOne({ where: { id: id } })
      .then(function (user_data) {
        res.render('admin/update-user', {
          id: user_data.id,
          first_name: user_data.first_name,
          last_name: user_data.last_name,
          dob: user_data.date_of_birth,
          address: user_data.address,
          email: user_data.email,
          password: user_data.password,
        });
      })
      .catch(function (err) { });
  } else {
    res.redirect('/adminlogin');
  }
});
router.get('/admin/contact-reply', (req, res) => {
  if (req.session.admin) {
    var ticket_no = req.query.tid;
    tickets
      .findAll({ where: { ticket_no: ticket_no } })
      .then(function (ticket_data) {
        res.render('admin/admin-contact-reply', {
          subject: ticket_data[0].subject,
          ticket_no: ticket_no,
          ticket_data: ticket_data,
        });
      })
      .catch(function (err) {
        return err;
      });
  } else {
  }
});
router.get('/admin/product/delete/:id', (req, res) => {
  Product.findOne({
    where: {
      id: req.params.id,
    },
  }).then((product) => {
    Product.destroy({
      where: {
        id: req.params.id,
      },
    })
      .then(() => {
        res.redirect('/admin/product/list');
      })
      .catch((err) => console.log(err));
  });

});
router.get('/admin/product/edit/:id', (req, res) => {
  if (req.session.admin) {
    Product.findOne({
      where: {
        id: req.params.id,
      },
    })
      .then((product) => {
        checkOptions(product);
        res.render('product/editProduct', {
          product,
        });
      })
      .catch((err) => console.log(err));
  } else {
    res.render('admin/login', { fail: 'fail', msg: 'Please login to your account first' });
  }
});
router.get('/admin/faq/delete/:id', (req, res) => {
  FAQ.findOne({
    where: {
      id: req.params.id,
    },
  }).then((faq) => {
    FAQ.destroy({
      where: {
        id: req.params.id,
      },
    })
      .then(() => {
        res.redirect('/admin/faq/list');
      })
      .catch((err) => console.log(err));
  });
});
router.post('/api/updateorder', async (req, res) => {

  if (req.body.status) {

    console.log(req.body.status);
    var rr = await db.query(`SELECT email FROM users inner join orders 
      on order_user_id=users.id AND orders.id=${req.body.id}`);
    sendMail(rr[0][0].email, 'Orderd Delieverd Successfully', "Your Order Delivered Successfully");
    Order.update({ IsDelivered: req.body.status }, { where: { id: req.body.id } })
      .then((a) => {
        res.send({ success: 'success' });
      }).catch((err) => {
        throw err;
      });

  } else {
    console.log("test");
    Order.update({ IsDelivered: req.body.status }, { where: { id: req.body.id } })
      .then((a) => {
        res.send({ success: 'success' });
      }).catch((err) => {
        throw err;
      });
  }
});


router.post('/api/deleteorder', (req, res) => {
  Order.destroy({ where: { id: req.body.id } })
    .then((a) => {
      res.send({ success: 'success' });
    }).catch((err) => {
      throw err;
    });
});
router.get('/admin/order/list', (req, res) => {
  Order.findAll()
    .then((orders) => {
      let totalOrders = orders.length;
      let totalSales = 0;
      orders.forEach(function (v, i) {
        totalSales += parseFloat(v.TotalPrice);
      });

      res.render('admin/orders', {
        orders: orders,
        totalOrders: totalOrders,
        totalSales: totalSales,
      });
    })
    .catch((err) => console.log(err));
});
router.get('/admin/logout', (req, res) => {
  req.session.admin = false;
  res.redirect('/admin/login');
});
/*== APIs ==*/
router.post('/api/register', (req, res) => {
  const passwordHash = bcrypt.hashSync(req.body.password, 10);
  var user_data = {
    first_name: req.body.fname,
    last_name: req.body.lname,
    date_of_birth: req.body.dob,
    address: req.body.address,
    email: req.body.email,
    password: req.body.password,
  };
  var password2 = req.body.password2;
  if (user_data.password !== password2) {
    res.json({
      status: 'fail',
      msg: 'Password/Confirm Password Must Match',
    });
  } else if (isFutureDate(user_data.date_of_birth)) {
    res.json({
      fail: 'fail',
      msg: 'Please Enter Valid Date of Birth',
    });
  } else if (req.body.captcha === undefined || req.body.captcha === '' || req.body.captcha === null) {
    res.json({
      status: 'fail',
      msg: 'Please Verify that you are not a robot',
    });
  } else {
    user_data.password = passwordHash;
    user
      .create(user_data)
      .then(function (data) {
        var mailTo = user_data.email;
        var subject = 'Verify Your Email';
        var link = 'http://localhost:5000/login?email=' + mailTo;
        var message = '<p>Hi! You have recently registered for a Bliss account. Please click the link below to verify your account</p> <a href="' + link + '">Verify my email </a>';
        sendMail(mailTo, subject, message);
        res.json({
          status: 'success',
          msg: 'Please Confirm Your Email to Login',
        });
      })
      .catch(function (err) {
        console.log(err);
        res.json({
          status: 'fail',
          msg: 'User Already exist ',
        });
      });
  }
});
router.post('/api/login', async (req, res) => {
  var login_data = {
    email: req.body.email,
    password: req.body.password,
  };
  req.body.randomnumber
  const user_found = await user.findOne({ where: { email: login_data.email, IsDeleted: 0 } });
  if (user_found) {
    if (user_found.is_active == false) {
      res.json({
        status: 'fail',
        msg: 'Please confirm your email to login',
      });



    } else if (user_found.IsSuspend == true) {
      res.json({
        status: 'fail',
        msg: 'Account Terminated Call For Further Queries:: UAN 111-000-622',
      });
    }


    else if (!bcrypt.compareSync(login_data.password, user_found.password)) {
      res.json({
        status: 'fail',
        msg: 'Invalid username or password',
      });
    } else {
      // req.session.user = user_found.id;
      sendMail(req.body.email, "Verification Code", "<div style=''> <div style=''>  <img style='height:auto; width:100%;' src='https://cdn.discordapp.com/attachments/482150370404204544/930007601838710794/unknown.png'/>  </div> <br> <div style='text-align:center'>  <div style='padding: 0; height:80vh; width: 80%; border:1px solid black; margin-left:10%; border-radius:0px; font-weight:5'>  <div style='width:100%; height:150px; background-color:#fc5c65; margin-top:-30px;' > <img style='height:auto; width:20%; margin-top:20px;' src='https://cdn.discordapp.com/attachments/666977224867446824/930365452612407316/WhatsApp_Image_2022-01-11_at_3.36.09_PM.jpeg.png'/> </div>    <div style = 'padding:20px;'> <h2 style='font-weight:5px;'> LOGIN OTP </h2> <div style=''><p style='text-align: left'>Hi " + user_found.first_name + "!</p><p style='text-align:left;'>There is a request to login into your account. Your  OTP for your login request is:</p> <br> <h2 style='color:red;'>" + req.body.randomnumber + "</h2> <p style = 'text-align:left;'> If the login is not initiated by you, please ignore this email and change your login credentials as soon as possible</p><p style='margin-Top:30px; text-align:right;'>Best Regards,</p> <img style='height:auto; width:6%; float:right;' src='https://cdn.discordapp.com/attachments/482150370404204544/929992723598049280/BlissLogo.png'/> <br> </div> </div> </div><div ><div style='color:white;textAlign:center'></div></div> </div></div>");
      res.json({
        status: 'success',
        msg: 'logged in',
      });
    }
  } else {
    res.json({
      status: 'fail',
      msg: 'Invalid Email or Password ',
    });
  }
});
router.get('/api/delete', async (req, res) => {
  const user_found = await user.findOne({ where: { id: req.session.user } });
  if (user_found) {
    user.update({ IsDeleted: 1 }, { where: { id: req.session.user } })
      .then(function () {
        req.session.user = false;
        req.session.cart = [];
        res.json({
          status: 'success',
          msg: 'Account deleted',
        });
      })
      .catch(function () {
        res.json({
          status: 'fail',
          msg: 'Unable to delete account',
        });
      })
  } else {
    res.json({
      status: 'fail',
      msg: 'Unable to delete account',
    });
  }
});
router.post('/api/forget', (req, res) => {
  var link = 'http://localhost:5000/reset-password?email=' + req.body.email;
  var message = '<p>Please click the link to reset your password</p> <a href="' + link + '">Reset</a>';
  sendMail(req.body.email, 'Reset Password', message);
  res.render('user/login', {
    success: 'success',
    msg: 'Please check your email to rest your Password',
  });
});
router.post('/api/reset', (req, res) => {
  var email = req.body.email;
  var password = req.body.password;
  var con_password = req.body.password2;
  var redirectLink = '/reset-password?email=' + email;
  if (password !== con_password) {
    res.redirect(redirectLink);
  } else {
    const passwordHash = bcrypt.hashSync(password, 10);
    var updated_password = {
      password: passwordHash,
    };
    const user_found = user.findOne({ where: { email: email } });
    if (user_found) {
      user
        .update(updated_password, { where: { email: email } })
        .then(function () {
          res.render('user/login', {
            success: 'success',
            msg: 'Password Updated Successfully',
          });
        })
        .catch(async function (err) {
          res.render('user/login', {
            fail: 'fail',
            msg: 'Password Updating Failed',
          });
        });
    } else {
      res.render('user/login', { fail: 'fail', msg: 'User do not exist' });
    }
  }
});
router.post('/api/profile/pic', upload.single('pic'), (req, res) => {
  if (req.file) {
    let filename = req.file.filename;
    var user_id = req.session.user;
    user.update({ profile_pic: filename }, { where: { id: user_id } }).then(async function (data) {
      var updated_user = await user.findOne({ where: { id: user_id } });
      res.render('user/profile', {
        success: 'success',
        msg: 'Profile Updated Successfully',
        first_name: updated_user.first_name,
        last_name: updated_user.last_name,
        dob: updated_user.date_of_birth,
        address: updated_user.address,
        email: updated_user.email,
        password: updated_user.password,
        isLogin: true,
        profile_pic: updated_user.profile_pic,
      });
    });
  } else throw 'error';
});
router.post('/api/donatematerial', upload.array('img', 100), async (req, res) => {
  const u = await User.findOne({ where: { id: req.session.user } });
  if (req.files && u) {
    let filename = '';
    for (let i = 0; i < req.files.length; i++) {
      filename += req.files[i].filename;
      if (i !== (req.files.length - 1))
        filename += '|';
    }
    Donations.create({
      Quantity: parseInt(req.body.qty),
      CustomerID: parseInt(u.id),
      Images: filename,
      IsReceived: 0,
      Material: req.body.materials,
      CustomerEmail: u.email,
      Username: u.first_name + " " + u.last_name
    }).then((done) => {
      var message = "<div style=''> <div style=''>  <img style='height:auto; width:100%;' src='https://cdn.discordapp.com/attachments/482150370404204544/930007601838710794/unknown.png'/>  </div> <br> <div style='text-align:center'>  <div style='padding: 0; height:80vh; width: 80%; border:1px solid black; margin-left:10%; border-radius:0px; font-weight:5'>  <div style='width:100%; height:150px; background-color:#fc5c65; margin-top:-30px;' > <img style='height:auto; width:20%; margin-top:20px;' src='https://cdn.discordapp.com/attachments/666977224867446824/930365452612407316/WhatsApp_Image_2022-01-11_at_3.36.09_PM.jpeg.png'/> </div>    <div style = 'padding:20px;'> <h2 style='font-weight:5px;'> DONATION PROCESSED !</h2> <div style=''><p style='text-align: left'>Hi " + u.first_name + "!</p><p style='text-align:left;'>Thank you for your genorisity. Our delivery personnel will be collecting the dress within the next 3 days from your address at:</p> <p style='text-align:left; color:blue'>" + u.address + " </p> <p style='text-align:left'> Your donated dress made of <label style='color:blue; text-align:left'>" + req.body.materials + "</label> is shown in the attachment below </p> <br>  <p style = 'text-align:left;'>   If there is any change in the address or inconvenience, please notify us immediately via the contact us page.</p><p style='margin-Top:30px; text-align:right;'>Best Regards,</p> <img style='height:auto; width:6%; float:right;' src='https://cdn.discordapp.com/attachments/482150370404204544/929992723598049280/BlissLogo.png'/> <br> </div> </div> </div><div ><div style='color:white;textAlign:center'></div></div> </div></div>"
      var attachment = [{ filename: 'Dress.jpg', path: 'http://localhost:5000/uploads/' + filename }]
      sendMail(u.email, "Dress.jpg", message, attachment);
      res.render('donationthanks', {
        Quantity: parseInt(req.body.qty),
        Images: filename.split('|'),
        Material: req.body.materials,
      });
    }).catch((error) => {
      throw error;
    });
  } else throw 'error';
});
router.post('/api/profile/update', async (req, res) => {
  var req_data = {
    first_name: req.body.fname,
    last_name: req.body.lname,
    date_of_birth: req.body.dob,
    address: req.body.address,
    email: req.body.email,
  };
  if (!req.body.password == '') {
    req_data.password = bcrypt.hashSync(req.body.password, 10);
  }
  var user_id = req.session.user;
  await user
    .update(req_data, { where: { id: user_id } })
    .then(async function (data) {
      var updated_user = await user.findOne({ where: { id: user_id } });
      let data1 = {
        success: 'success',
        msg: 'Profile Updated Successfully',
        first_name: updated_user.first_name,
        last_name: updated_user.last_name,
        dob: updated_user.date_of_birth,
        address: updated_user.address,
        email: updated_user.email,
        password: updated_user.password,
        isLogin: true,
      };
      if (updated_user.profile_pic !== null && updated_user.profile_pic !== '') {
        data1.profile_pic = updated_user.profile_pic;
      }
      res.render('user/profile', data1);
    })
    .catch(async function (err) {
      var updated_user = await user.findOne({ where: { id: user_id } });
      let data = {
        fail: 'fail',
        msg: 'This email is used by another user.',
        first_name: req_data.first_name,
        last_name: req_data.last_name,
        dob: req_data.date_of_birth,
        address: req_data.address,
        email: updated_user.email,
        password: req_data.password,
        isLogin: true,
      };
      if (updated_user.profile_pic !== null && updated_user.profile_pic !== '') {
        data.profile_pic = updated_user.profile_pic;
      }
      res.render('user/profile');
    });
});
router.get('/api/profile/delete', async (req, res) => {
  if (req.session.user) {
    var user_id = req.session.user;
    var user_data = await user.destroy({ where: { id: user_id } });
    req.session.user = false;
    res.render('index');
  } else {
    res.render('index', {
      isLogin: false,
      msg: 'Please Login to Access this Page',
      title: 'Bliss',
    });
  }
});
router.get('/api/profile/picture', async (req, res) => {
  if (req.session.user) {
    var user_id = req.session.user;
    var user_data = await user.findAll({ where: { id: user_id } });
    res.json({ status: 'success', pic: user_data[0].dataValues.profile_pic });
  } else {
    res.json({ status: 'fail' });
  }
});
router.post('/api/submit-contact', async (req, res) => {
  if (req.session.user) {
    let foundUser = await user.findOne({ where: { id: req.session.user } });
    let name = foundUser.datavalues.first_name
    var tickets_data = {
      subject: req.body.subject,
      message: req.body.message,
      ticket_no: req.body.tid,
      user_id: req.session.user,
      added_by: name,
    };
    tickets
      .create(tickets_data)
      .then(function (data) {
        res.redirect('/contact-tickets');
      })
      .catch(function (err) {
        res.render('user/contact-tickets', {
          fail: 'fail',
          msg: 'Failed to add ticket, please add it later ',
        });
      });
  } else {
    const title = 'Bliss';
    res.render('index', { title: title });
  }
});
router.post('/api/contact', async (req, res) => {
  if (req.session.user) {
    let foundUser = await user.findOne({ where: { id: req.session.user } });
    let name = foundUser.dataValues.first_name;
    var tickets_data = {
      subject: req.body.subject,
      message: req.body.message,
      ticket_no: req.body.tid,
      user_id: req.session.user,
      added_by: name,
    };
    tickets
      .create(tickets_data)
      .then(function (data) {
        res.redirect('/contact-tickets');
      })
      .catch(function (err) {
        res.render('user/contact-tickets', {
          fail: 'fail',
          msg: 'Failed to add ticket, please add it later ',
        });
      });
    // res.redirect('/contact-tickets');
  } else {
    const title = 'Bliss';
    res.render('index', { title: title });
  }
});
router.post('/api/product/get-top', (req, res) => {
  Product.findAll({
    limit: 3,
    order: [['Popularity', 'DESC']],
    raw: true,
  })
    .then((products) => {
      res.json(products);
    })
    .catch((err) => console.log(err));
});
router.post('/api/product/get-all', (req, res) => {
  Product.findAll({
    order: [['Popularity', 'DESC']],
    raw: true,
  })
    .then((products) => {
      res.json(products);
    })
    .catch((err) => console.log(err));
});
router.post('/api/product/get-cart-products', (req, res) => {
  Product.findAll({
    order: [['Brand', 'ASC']],
    raw: true,
  })
    .then(async (products) => {
      let cartProducts = req.session.cart;
      if (cartProducts == undefined || cartProducts == '' || cartProducts.length <= 0) {
        res.json({ products: [], GiveDiscount: false });
        console.log(' No i am running');
      } else {
        console.log('i am running');

        let finalProducts = [];
        products.forEach((product) => {
          cartProducts.forEach((cartProduct) => {
            if (cartProduct.id == product.id) {
              product['cartQty'] = cartProduct['qty'];
              product['extraCharges'] = cartProduct['extraCharges'];
              product['materialName'] = cartProduct['materialName'];
              product['materialId'] = cartProduct['materialId'];
              product['waist'] = cartProduct['waist'];
              product['height'] = cartProduct['height'];
              product['colors'] = cartProduct['colors'];
              product['cupsize'] = cartProduct['cupsize'];
              product['shouldersize'] = cartProduct['shouldersize'];
              console.log(product);
              finalProducts.push({ ...product });

            }
          });
        });
        if (req.session.user) {
          const u = await User.findOne({ where: { id: parseInt(req.session.user) } });
          res.json({ products: finalProducts, GiveDiscount: u.GiveDiscount });
        } else {
          res.json({ products: finalProducts, GiveDiscount: false });
        }
      }
    })
    .catch((err) => console.log(err));
});
router.post('/api/product/add-to-cart', (req, res) => {
  console.log(req.body);
  console.log('running');
  if (req.session.cart == undefined) {
    req.session.cart = [];
  }
  console.log(req.body);
  if (req.body.exact == true) {
    req.session.cart.forEach((item, index) => {
      if (item.id == req.body.id && item.colors === req.body.colors && parseInt(item.materialId) === req.body.materialId && parseInt(item.waist) === parseInt(req.body.waist) && parseInt(item.height) === parseInt(req.body.height)) {
        req.session.cart[index] = { ...req.session.cart[index], qty: req.body.qty };
      }
    });
  } else {
    let found = false;
    let foundIndex = -1;
    req.session.cart.forEach((item, index) => {
      if (item.id == req.body.id && item.colors === req.body.colors && parseInt(item.materialId) === req.body.materialId && parseInt(item.waist) === parseInt(req.body.waist) && parseInt(item.height) === parseInt(req.body.height)) {
        found = true;
        foundIndex = index;
      }
    });
    if (foundIndex !== -1) {
      let oldQty = req.session.cart[foundIndex].qty;
      let oldExtraCharges = req.session.cart[foundIndex].extraCharges;
      let newQty = parseFloat(oldQty) + parseFloat(req.body.qty);
      //req.session.cart[foundIndex] = { id: req.body.id, qty: newQty, waist: req.body.waist, colors: req.body.colors, height: req.body.height, materialName: req.body.materialName, extraCharges: oldExtraCharges + req.body.extraCharges, materialId: req.body.materialId };
      req.session.cart[foundIndex] = { ...req.session.cart[foundIndex], qty: newQty, extraCharges: oldExtraCharges + req.body.extraCharges };
    } else {
      req.session.cart.push({ id: req.body.id, qty: req.body.qty, waist: req.body.waist, colors: req.body.colors, height: req.body.height, extraCharges: req.body.extraCharges, materialName: req.body.materialName, materialId: req.body.materialId, cupsize: req.body.cupsize, shouldersize: req.body.shouldersize });
    }
  }
  res.json({ status: 'success', msg: 'Product added to cart' });
});
router.post('/api/product/remove-from-cart', (req, res) => {
  if (req.session.cart == undefined) {
    req.session.cart = [];
  }
  req.session.cart.forEach((item, index) => {
    if (item.id == req.body.id && item.colors === req.body.colors && parseInt(item.materialId) === req.body.materialId && parseInt(item.waist) === parseInt(req.body.waist) && parseInt(item.height) === parseInt(req.body.height)) {
      req.session.cart.splice(index, 1);
    }
  });
  res.json({ status: 'success', msg: 'Product removed from cart' });
});
router.post('/api/admin/login', async (req, res) => {
  var login_data = {
    email: req.body.email,
    password: req.body.password,
  };
  const admin_found = await admin.findOne({
    where: { email: login_data.email, password: login_data.password },
  });
  if (admin_found) {
    req.session.admin = admin_found.id;
    res.redirect('/admin/dashboard');
  } else {
    res.render('admin/login', {
      fail: 'fail',
      msg: 'Invalid Email or Password',
    });
  }
});
router.post('/api/admin/user/update', async (req, res) => {
  var req_data = {
    first_name: req.body.fname,
    last_name: req.body.lname,
    date_of_birth: req.body.dob,
    address: req.body.address,
    email: req.body.email,
  };
  if (!req.body.password == '') {
    req_data.password = bcrypt.hashSync(req.body.password, 10);
  }
  var id = req.query.id;
  await user
    .update(req_data, { where: { id: id } })
    .then(async function (data) {
      res.redirect('/admin/dashboard');
    })
    .catch(function (err) {
      res.redirect('/admin/dashboard');
    });
});
router.get('/api/admin/user/delete', async (req, res) => {
  await user
    .destroy({ where: { id: req.query.id } })
    .then(function (deleteRow) {
      res.redirect('/admin/dashboard');
    })
    .catch(function (err) {
      res.redirect('/admin/dashboard');
    });
});
router.post('/api/submit-admin-contact', (req, res) => {
  if (req.session.admin) {
    var tickets_data = {
      subject: req.body.subject,
      message: req.body.message,
      ticket_no: req.body.tid,
      added_by: 'admin',
    };
    tickets
      .create(tickets_data)
      .then(function (data) {
        res.redirect('/admin/msg');
      })
      .catch(function (err) {
        res.render('admin/admin-contact-messages', {
          fail: 'fail',
          msg: 'Failed to add ticket, please add it later ',
        });
      });
    // res.redirect('/contact-tickets');
  } else {
    const title = 'Bliss';
    res.render('admin/login', { fail: 'fail', msg: 'PLease Login to complete this task', title: title });
  }
});
router.post('/api/admin/product/add', (req, res) => {
  let Brand = req.body.brand;
  let Name = req.body.name;
  let Stock = req.body.stock;
  let posterUpload = req.body.image;
  let Colour = req.body.color;
  let Storage = req.body.storage;
  let Price = req.body.price;
  let Description = req.body.description.slice(0, 1999);
  Product.create({
    Brand,
    Name,
    Stock,
    posterUpload,
    Colour,
    Storage,
    Price,
    Description,
  })
    .then((product) => {
      res.json({ status: 'success', msg: 'Product added' });
    })
    .catch((err) => console.log(err));
});
router.post('/api/admin/product/update/:id', (req, res) => {
  if (req.session.admin) {
    let Brand = req.body.brand;
    let Name = req.body.name;
    let posterUpload = req.body.image;
    let Stock = req.body.stock;
    let Colour = req.body.color;
    let Storage = req.body.storage;
    let Price = req.body.price;
    let Description = req.body.description.slice(0, 1999);
    Product.update(
      {
        Brand,
        Name,
        posterUpload,
        Stock,
        Colour,
        Storage,
        Price,
        Description,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    )
      .then(() => {
        res.redirect('/admin/product/list');
      })
      .catch((err) => console.log(err));
  } else {
    res.redirect('/admin/login');
  }
});
router.post('/api/admin/faq/add', (req, res) => {
  let question = req.body.question;
  let answer = req.body.answer;
  FAQ.create({
    question,
    answer,
  })
    .then((faq) => {
      res.redirect('/admin/faq/list');
    })
    .catch((err) => console.log(err));
});
router.post('/api/admin/faq/update', (req, res) => {
  let question = req.body.question;
  let answer = req.body.answer;
  let id = req.body.id;
  FAQ.update({ question: question, answer: answer }, { where: { id: id } })
    .then((faq) => {
      res.redirect('/admin/faq/list');
    })
    .catch((err) => console.log(err));
});
router.post('/api/upload/image', upload.single('image'), (req, res) => {
  if (req.file) {
    let filename = req.file.filename;
    res.json({ file: filename });
  } else throw 'error';
});

router.post('/api/updatedonationinfo', (req, res) => {
  if (req.session.admin) {
    req.body.map(async (donation) => {
      const u = await User.findOne({ where: { id: donation.customerId } });
      Donations.update({ IsReceived: donation.IsReceived }, { where: { id: donation.id } })
        .then(async (d) => {
          if (donation.IsReceived) {
            const code = await generateDiscountCode();
            DiscountCodes.create({
              UserID: donation.customerId,
              DiscountCode: code,
              IsClaimed: 0
            }).then((dc) => {
              const msg = "<div style=''> <div style=''>  <img style='height:auto; width:100%;' src='https://cdn.discordapp.com/attachments/482150370404204544/930007601838710794/unknown.png'/>  </div> <br> <div style='text-align:center'>  <div style='padding: 0; height:85vh; width: 80%; border:1px solid black; margin-left:10%; border-radius:0px; font-weight:5'>  <div style='width:100%; height:150px; background-color:#fc5c65; margin-top:-30px;' > <img style='height:auto; width:20%; margin-top:20px;' src='https://cdn.discordapp.com/attachments/666977224867446824/930365452612407316/WhatsApp_Image_2022-01-11_at_3.36.09_PM.jpeg.png'/> </div>    <div style = 'padding:20px;'> <h2 style='font-weight:5px;'> USE FOR 5% DISCOUNT !</h2> <div style=''><p style='text-align: left'>Hi " + u.first_name + "!</p><p style='text-align:left;'> </p> <p style='text-align:left'> Thank you once again for your donation. This is to inform you that your dress has reached us successfully.  <br> <br> Your discount code is: <br> <b> <label style='color:red; font-size:40px; margin-left:40%; font-weight:100px;'>" + code + "</label> </b> </p> <br> <p style = 'text-align:left;'> Use your discount code <a href='http://localhost:5000/products'>now</a> for a 5% discount on your overall purchase </p><p style='margin-Top:30px; text-align:right;'>Best Regards,</p> <img style='height:auto; width:6%; float:right;' src='https://cdn.discordapp.com/attachments/482150370404204544/929992723598049280/BlissLogo.png'/> <br> </div> </div> </div><div ><div style='color:white;textAlign:center'></div></div> </div></div>"
              sendMail(donation.email, 'Discount Code', msg);
            }).catch((err) => {
              throw err;
            });
          }
          // u.update({ ...u, GiveDiscount: (donation.IsReceived) ? 1 : u.GiveDiscount }, { where: { id: u.id } })
          //   .then((us) => {

          //   })
          //   .catch((err) => {
          //     throw err;
          //   });
        }).catch((err) => {
          throw err;
        });
    });
    res.send({ success: 'success' });
  } else {
    res.redirect('login');
  }
});

router.post('/api/applydiscountcode', async (req, res) => {
  if (req.session.user) {
    const id = req.session.user;
    try {
      const c = await DiscountCodes.findOne({ where: { UserID: id, DiscountCode: req.body.dcode, IsClaimed: 0 } });
      if (c && c.DiscountCode === req.body.dcode) {
        req.session.DiscountCode = req.body.dcode;
        res.send({ status: true });
      } else {
        res.send({ status: false });
      }
    } catch (error) {
      throw error;
    }
  }
});
router.post('/api/checkout', (req, res) => {
  console.log(req.body);
  console.log('calling');
  let address = req.body.address + ' ' + req.body.apartment;
  let user_id = null;
  let u = undefined;

  if (req.session.user != undefined && req.session.user != null) {
    user_id = req.session.user;
  }
  if (req.session.cart == undefined) {
    req.session.cart = [];
  }

  let total = 0;
  let _products = [];
  Product.findAll({
    order: [['Brand', 'ASC']],
    raw: true,
  })
    .then((products) => {
      products.forEach(function (p, pi) {
        req.session.cart.forEach(async function (v, i) {
          if (v.id == p.id) {
            total += (parseFloat(v.qty) * (parseFloat(p.Price) + parseFloat(v.extraCharges)));
            _products.push(p.Name + '(' + v.colors + ')' + ' x ' + v.qty + ' - (Material: ' + v.materialName + ', Waist: ' + v.waist + ', Height: ' + v.height + ', Cup & Band Size: ' + v.cupsize + ', Shoulder Length: ' + v.shouldersize + ')');
            await Product.update({ Popularity: parseInt(p.Popularity) + parseInt(v.qty) }, { where: { id: p.id } });

            if (v.materialId !== -1) {
              //await Material.update({ Popularity: Popularity + 1, Qunatity: Qunatity - (v.height * v.qty) }, { where: { id: v.materialId } });
              await db.query(`UPDATE material SET Popularity=Popularity+1, Qunatity=Qunatity-${(v.height * v.qty)} WHERE id=${v.materialId}`);

              var result = await db.query(`SELECT Name, (CASE WHEN Qunatity<500 THEN 1 ELSE 0 END ) AS lowonmaterial FROM material where id=${v.materialId}`);
              var result1 = await db.query(`SELECT email FROM admins lIMIT 1;`);
              if (result[0][0].lowonmaterial === 1) {
                sendMail(result1[0][0].email, 'Low On Material', `Low On Material ${result[0][0].Name}`);
              }
              console.log(result1[0][0].email);
              console.log(result[0][0].lowonmaterial);
            }
          }
        });
      });
      stripe.customers
        .create({
          email: req.body.stripeEmail,
          source: req.body.stripeToken,
          name: 'Bliss',
        })
        .then((customer) => {
          return stripe.charges.create({
            amount: total * 100,
            description: 'Mobile',
            currency: 'USD',
            customer: customer.id,
          });
        })
        .then(async (charge) => {
          _products = _products.join();
          let datetime = new Date().toLocaleString();
          let tot = total;
          let gtot = total;
          let disc = 0.0;
          u = await User.findOne({ where: { id: user_id } });
          if (u) {
            if (req.session.DiscountCode !== undefined && req.session.DiscountCode !== null) {
              disc = parseFloat(total * 0.05);
              tot -= parseFloat(disc);
              await DiscountCodes.update({ UserID: user_id, DiscountCode: req.session.DiscountCode, IsClaimed: 1, }, { where: { UserID: user_id, DiscountCode: req.session.DiscountCode } });
            }
          }
          Order.create({
            order_id: charge.id,
            order_price: gtot,
            order_email: req.body.stripeEmail,
            order_products: _products,
            order_date: datetime,
            order_user_id: user_id,
            order_address: address,
            DiscountPrice: disc,
            TotalPrice: tot,
            paymentmethod: "Stripe"
          })
            .then((order) => {
              req.session.cart = [];
              req.session.DiscountCode = undefined;
              if (u)
                u.update({ ...u, GiveDiscount: false }, { where: { id: u.id } });
              let msg = `
                Dear Customer, <br/>
                Your Order has been placed. Your order details are as follows:<br />
                Order Id: ${charge.id}, <br />
                Email: ${req.body.stripeEmail}, <br />
                Products: ${_products} <br />
                Address: ${address}  <br />
                Total: $${gtot} <br />
                Discount: -$${disc} <br />
                Grand Total: $${tot} <br />
              `;
              sendMail(req.body.stripeEmail, 'Your order is placed', msg);
              res.render('thankyou', order.dataValues);
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => {
          res.send(err);
        });
    })
    .catch((err) => console.log(err));
});
router.post('/api/reportsdetail', async (req, res) => {

  var total_users = await db.query("SELECT COUNT(*) As 'count' from users", { type: QueryTypes.SELECT });
  var top_dressed = await db.query("SELECT Name FROM products  Order By Popularity DESC LIMIT 3 ;", { type: QueryTypes.SELECT });
  var material_popularity = await db.query("SELECT Name,Popularity FROM material ;", { type: QueryTypes.SELECT });
  var sales = await db.query("SELECT MONTHNAME(createdAt) As 'MonthName' ,COUNT(*) AS 'Sales' FROM orders   GROUP BY MONTH (createdAt)  ORDER BY createdAt  Desc LIMIT 3 ;", { type: QueryTypes.SELECT });

  res.send(
    {
      total_users: total_users[0],
      top_dressed: top_dressed,
      material_popularity: material_popularity,
      sales: sales

    });
});
router.post('/addmaterials', async (req, res) => {


  console.log(req.body.ScreenData);
  var query = `INSERT INTO material
         (
         Name,
        
         ExtraPrice,
         Qunatity)
         VALUES
         (
         '${req.body.ScreenData.material_name}',
        
         ${req.body.ScreenData.quantity},
         ${req.body.ScreenData.cost});`


  var result = db.query(query);
  res.send(result);
});

router.post('/editmaterials', async (req, res) => {
  console.log(req.body.ScreenData);
  await db.query(`update  material SET Qunatity=${req.body.ScreenData.quantity} ,ExtraPrice=${req.body.ScreenData.cost} where id=${req.body.ScreenData.material_id};`);
  res.send("success");
});
router.post('/chatbot', async (req, res) => {

  var questions = await db.query("SELECT question, answer  FROM faqs;", { type: QueryTypes.SELECT });
  console.log("Running");
  console.log(questions);

  res.send(questions);

});
router.post('/api/verifyotp', async (req, res) => {
  var login_data = {
    email: req.body.email,
    password: req.body.password,
  };
  const user_found = await user.findOne({ where: { email: login_data.email, IsDeleted: 0 } });
  if (user_found) {
    if (user_found.is_active == false) {
      res.json({
        status: 'fail',
        msg: 'Please confirm your email to login',
      });
    } else if (!bcrypt.compareSync(login_data.password, user_found.password)) {
      res.json({
        status: 'fail',
        msg: 'Invlid username or password',
      });
    } else {
      req.session.user = user_found.id;

      res.json({
        status: 'success',
        msg: 'logged in',
      });
    }
  } else {
    res.json({
      status: 'fail',
      msg: 'Invalid Email or Password ',
    });
  }
});

router.post('/suspend', async (req, res) => {
  var questions = await db.query(`UPDATE users SET IsSuspend=1, Reason='${req.body.reason}'WHERE id='${req.body.id}'`, { type: QueryTypes.UPDATE });
  res.send('success')
});
router.post('/unsuspend', async (req, res) => {

  var questions = await db.query(`UPDATE users SET IsSuspend=0, Reason='${req.body.reason}'WHERE id='${req.body.id}'`, { type: QueryTypes.UPDATE });


  res.send('success')
});



router.get('/thankyou1', (req, res) => {

  console.log(req.query.id);

  Order.findOne({ where: { order_id: req.query.id } })
    .then((order) => {
      res.render('thankyou', {
        order_id: req.query.id,
        order_products: order.order_products,
        order_email: order.order_email,
        order_address: order.order_address,
        order_date: order.order_date,
        order_price: order.order_price,
        DiscountPrice: order.DiscountPrice,
        TotalPrice: order.TotalPrice,
      })
    })

});


router.post('/api/paypalorder', (req, res) => {

  console.log('calling');
  let address = req.body.address;
  let user_id = null;
  let u = undefined;
  var datetime = new Date().toLocaleString();
  var tot = 0;
  var gtot = 0;
  var disc = 0.0;
  let total = 0;
  let useraccount = null;
  let _products = [];
  if (req.session.user != undefined && req.session.user != null) {
    user_id = req.session.user;
  }
  if (req.session.cart == undefined) {
    req.session.cart = [];
  }


  User.findOne({ where: { id: user_id } })
    .then(users => {
      useraccount = users.email;
      console.log("asdsadsa " + users.email);
    }).catch((err) => console.log(err));


  Product.findAll({
    order: [['Brand', 'ASC']],
    raw: true,
  }).then(async (products) => {

    products.forEach(function (p, pi) {
      req.session.cart.forEach(async function (v, i) {
        if (v.id == p.id) {
          total += (parseFloat(v.qty) * (parseFloat(p.Price) + parseFloat(v.extraCharges)));
          _products.push(p.Name + '(' + v.colors + ')' + ' x ' + v.qty + ' - (Material: ' + v.materialName + ', Waist: ' + v.waist + ', Height: ' + v.height + ')');
          await Product.update({ Popularity: p.Popularity + v.qty }, { where: { id: p.id } });
          tot = total;
          gtot = total;
          if (v.materialId !== -1) {
            console.log("adsfhjkhgfdsfhjgfdghjoiuytrewdsxcvbniuyttrefdgiuytrfdvbnmkuyt");
            //await Material.update({ Popularity: Popularity + 1, Qunatity: Qunatity - (v.height * v.qty) }, { where: { id: v.materialId } });
            var rr = await db.query(`UPDATE material SET Popularity= IFNULL(Popularity,0)+1, Qunatity=Qunatity-${(v.height * v.qty)} WHERE id=${v.materialId}`);

            var result = await db.query(`SELECT Name, (CASE WHEN Qunatity<500 THEN 1 ELSE 0 END ) AS lowonmaterial FROM account.material where id=${v.materialId}`);
            var result1 = await db.query(`SELECT email FROM account.admins lIMIT 1;`);
            if (result[0][0].lowonmaterial === 1) {
              sendMail(result1[0][0].email, 'Low On Material', `Low On Material ${result[0][0].Name}`);
            }
            console.log(result1[0][0].email);
            console.log(result[0][0].lowonmaterial);
          }

        }
      });
    });

    tot = total;
    gtot = total;

    u = await User.findOne({ where: { id: user_id } });
    if (u) {
      if (req.session.DiscountCode !== undefined && req.session.DiscountCode !== null) {
        disc = parseFloat(total * 0.05);
        tot -= parseFloat(disc);
        await DiscountCodes.update({ UserID: user_id, DiscountCode: req.session.DiscountCode, IsClaimed: 1 }, { where: { UserID: user_id, DiscountCode: req.session.DiscountCode } });
      }
    }
    _products = _products.join();

    Order.create({
      order_id: req.body.id,
      order_price: gtot,
      order_email: useraccount,
      order_products: _products,
      order_date: datetime,
      order_user_id: user_id,
      order_address: req.body.address.address_line_1 + " " + req.body.address.admin_area_2 + " " + req.body.address.postal_code,
      DiscountPrice: disc,
      TotalPrice: tot,
      paymentmethod: "Paypal"
    })
      .then((order) => {
        req.session.cart = [];
        req.session.DiscountCode = undefined;
        if (u)
          u.update({ ...u, GiveDiscount: false }, { where: { id: u.id } });
        let msg = `
        Dear Customer, <br/>
        Your Order has been placed. Your order details are as follows:<br />
        Order Id: ${req.body.id}, <br />
        Email: ${useraccount}, <br />
        Products: ${_products} <br />
        Address: ${req.body.address.address_line_1 + " " + req.body.address.admin_area_2 + " " + req.body.address.postal_code}  <br />
        Total: $${gtot} <br />
        Discount: -$${disc} <br />
        Grand Total: $${tot} <br />
      `;
        sendMail(useraccount, 'Your order is placed', msg);
        console.log("RENDERING 1")
        res.render('thankyou', order.dataValues);
        console.log("TEST RENDER 1")
      })
      .catch((err) => console.log(err));



  })




});







router.post('/api/paypalcheckout', (req, res) => {
  console.log('calling');
  let address = req.body.address;
  let user_id = null;
  let u = undefined;
  var datetime = new Date().toLocaleString();
  var tot = 0;
  var gtot = 0;
  var disc = 0.0;
  let total = 0;
  let useraccount = null;
  let _products = [];
  if (req.session.user != undefined && req.session.user != null) {
    user_id = req.session.user;
  }
  if (req.session.cart == undefined) {
    req.session.cart = [];
  }


  User.findOne({ where: { id: user_id } })
    .then(users => {
      useraccount = users.email;
      console.log("asdsadsa " + users.email);
    }).catch((err) => console.log(err));


  Product.findAll({
    order: [['Brand', 'ASC']],
    raw: true,
  })
    .then(async (products) => {
      products.forEach(function (p, pi) {
        req.session.cart.forEach(async function (v, i) {
          if (v.id == p.id) {
            total += (parseFloat(v.qty) * (parseFloat(p.Price) + parseFloat(v.extraCharges)));
            _products.push(p.Name + '(' + v.colors + ')' + ' x ' + v.qty + ' - (Material: ' + v.materialName + ', Waist: ' + v.waist + ', Height: ' + v.height + ')');
            await Product.update({ Popularity: p.Popularity + v.qty }, { where: { id: p.id } });
            tot = total;
            gtot = total;
            if (v.materialId !== -1) {
              console.log("adsfhjkhgfdsfhjgfdghjoiuytrewdsxcvbniuyttrefdgiuytrfdvbnmkuyt");
              //await Material.update({ Popularity: Popularity + 1, Qunatity: Qunatity - (v.height * v.qty) }, { where: { id: v.materialId } });
              var rr = await db.query(`UPDATE material SET Popularity= IFNULL(Popularity,0)+1, Qunatity=Qunatity-${(v.height * v.qty)} WHERE id=${v.materialId}`);
              var result = await db.query(`SELECT Name, (CASE WHEN Qunatity<500 THEN 1 ELSE 0 END ) AS lowonmaterial FROM material where id=${v.materialId}`);
              var result1 = await db.query(`SELECT email FROM admins lIMIT 1;`);
              if (result[0][0].lowonmaterial === 1) {
                sendMail(result1[0][0].email, 'Low On Material', `Low On Material ${result[0][0].Name}`);
              }
              console.log(result1[0][0].email);
              console.log(result[0][0].lowonmaterial);
            }
          }
        });
      });
      stripe.customers
        .create({
          email: useraccount,
          source: req.body.stripeToken,
          name: 'Bliss',
        })
        .then((customer) => {
          return stripe.charges.create({
            amount: total * 100,
            description: 'Bliss',
            currency: 'USD',
            customer: customer.id,
          });
        })
        .then(async (charge) => {
          tot = total;
          gtot = total;
          u = await User.findOne({ where: { id: user_id } });
          if (u) {
            if (req.session.DiscountCode !== undefined && req.session.DiscountCode !== null) {
              disc = parseFloat(total * 0.05);
              tot -= parseFloat(disc);
              await DiscountCodes.update({ UserID: user_id, DiscountCode: req.session.DiscountCode, IsClaimed: 1 }, { where: { UserID: user_id, DiscountCode: req.session.DiscountCode } });
            }
          }
          Order.create({
            order_id: charge.id,
            order_price: gtot,
            order_email: useraccount,
            order_products: _products,
            order_date: datetime,
            order_user_id: user_id,
            order_address: address,
            DiscountPrice: disc,
            TotalPrice: tot
          })
            .then((order) => {
              req.session.cart = [];
              req.session.DiscountCode = undefined;
              if (u)
                u.update({ ...u, GiveDiscount: false }, { where: { id: u.id } });
              let msg = `
                Dear Customer, <br/>
                Your Order has been placed. Your order details are as follows:<br />
                Order Id: ${charge.id}, <br />
                Email: ${useraccount}, <br />
                Products: ${_products} <br />
                Address: ${address}  <br />
                Total: $${gtot} <br />
                Discount: -$${disc} <br />
                Grand Total: $${tot} <br />
              `;
              sendMail(useraccount, 'Your order is placed', msg);
              console.log("RENDERING 1")
              res.render('thankyou', order.dataValues);
              console.log("TEST RENDER 1")
            })
            .catch((err) => console.log(err));
        })
        .catch(async (err) => {
          u = await User.findOne({ where: { id: user_id } });
          if (u) {
            if (req.session.DiscountCode !== undefined && req.session.DiscountCode !== null) {
              disc = parseFloat(total * 0.05);
              tot -= parseFloat(disc);
              await DiscountCodes.update({ UserID: user_id, DiscountCode: req.session.DiscountCode, IsClaimed: 1 }, { where: { UserID: user_id, DiscountCode: req.session.DiscountCode } });
            }
          }
          _products = _products.join();
          datetime = new Date().toLocaleString();
          tot = total;
          gtot = total;
          disc = 0.0;
          var temp = Math.floor(Math.random() * 10000)
          Order.create({
            order_id: temp,
            order_price: gtot,
            order_email: useraccount,
            order_products: _products,
            order_date: datetime,
            order_user_id: user_id,
            order_address: address,
            DiscountPrice: disc,
            TotalPrice: tot
          })
            .then((order) => {
              req.session.cart = [];
              req.session.DiscountCode = undefined;
              if (u)
                u.update({ ...u, GiveDiscount: false }, { where: { id: u.id } });
              let msg = `
                Dear Customer, <br/>
                Your Order has been placed. Your order details are as follows:<br />
                Order Id: ${temp}, <br />
                Email: ${useraccount}, <br />
                Products: ${_products} <br />
                Address: ${address}  <br />
                Total: $${gtot} <br />
                Discount: -$${disc} <br />
                Grand Total: $${tot} <br />
              `;
              sendMail(useraccount, 'Your order is placed', msg);
              console.log("RENDERING 2");
              res.render('thankyou', order.dataValues);
              console.log("TEST RENDER 2");
            })
            .catch((err) => console.log(err));
        });
    })
    .catch((err) => console.log(err));
});

router.get('/donated', async (req, res) => {
  await user
    .findAll()
    .then(async function (user_data) {
      const donations = await Donations.findAll({ where: { CustomerID: req.session.user } });
      res.render('user/donated', {
        user_data: user_data,
        donations: donations,
        isLoginAdmin: true,
      });
    })
});


router.post('/api/cancelorder', async (req, res) => {
  console.log(req.body);

  if (req.body.status) {

    try {
      var result = await db.query(`UPDATE orders SET IsCanceled=0 ,Reason='${req.body.reason}' where id=${req.body.id}`, { type: QueryTypes.UPDATE });
      res.send("success");
    } catch (e) {
      res.send("success");
      console.log(e);
    }

  } else {
    try {
      var result = await db.query(`UPDATE orders SET IsCanceled=1 ,Reason='${req.body.reason}' where id=${req.body.id}`, { type: QueryTypes.UPDATE });
      res.send("success");
    } catch (e) {
      res.send("success");
      console.log(e);
    }
  }
});






module.exports = router;
