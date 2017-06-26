const formidable = require('formidable');
const md5 = require('../models/md5').md5;
const db = require('../models/db');
var sd = require('silly-datetime');
const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const path = require('path');
const ObjectId=require('mongodb').ObjectID;

//显示首页
exports.showIndex = function (req, res, next) {
  res.render('index', {
    login: req.session.login ? true : false,
    avatar: req.session.avatar ? req.session.avatar : 'female.png',
    username: req.session.username,
    current: "首页"
  });

};
//显示注册页
exports.showReg = function (req, res, next) {
  res.render('reg', {
    login: req.session.login ? true : false,
    username: req.session.username,
    current: "注册"
  });
};
//执行注册功能
exports.doReg = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields) {
    //console.log(fields);
    var {username, password}=fields;
    var avatar = 'female.png';
    password = md5(md5(password).substr(7, 11) + 'mm');
    //写入数据库前，先查看用户名是否存在
    db.find('users', {username}, function (err, result) {
      if (err) {
        res.send({"bok": false, "msg": "服务器错误"});
        return
      }
      if (result.length === 0) {//没有这个用户
        //存入数据库
        db.insert('users', {username, password, avatar}, function (err, result) {
          if (err) {
            res.send({"bok": false, "msg": "数据插入失败"});
            return;
          }
          //设置session
          req.session.login = true;
          req.session.username = username;
          req.session.avatar = avatar;
          res.send({"bok": true, "msg": "注册成功"});
        })
      } else {//有这个用户名
        res.send({"bok": false, "msg": "该用户名已经存在"});
      }
    })

  })
};

//显示登录页面
exports.showLogin = function (req, res, next) {
  res.render('login', {
    login: req.session.login ? true : false,
    username: req.session.login ? req.session.username : '',
    current: "登录"
  });
};

//执行登录功能
exports.doLogin = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields) {
    var {username, password}=fields;
    password = md5(md5(password).substr(7, 11) + 'mm');
    //写入数据库前，先查看用户名是否存在
    db.find('users', {username}, function (err, result) {
      if (err) {
        res.send({"bok": false, "msg": "服务器错误"});
        return
      }
      if (result.length === 0) {//没有这个用户 登录失败
        res.send({"bok": false, "msg": "该用户不存在"});
      } else {//有这个用户名
        if (result[0].password == password) {
          req.session.login = true;
          req.session.username = username;
          req.session.avatar = result[0].avatar;
          res.send({"bok": true, "msg": "登录成功"});
        } else {
          res.send({"bok": false, "msg": "密码错误"});
        }
      }
    })
  })
};

//退出
exports.logout = function (req, res, next) {
  req.session.login = false;
  req.session.username = "";
  res.redirect('/')
};

//头像上传页面显示
exports.upAvatar = function (req, res, next) {
  if (!req.session.login) {
    res.send('请登陆后再进行操作');
    return;
  }
  res.render('upFile', {
    login: req.session.login ? true : false,
    username: req.session.login ? req.session.username : '',
    current: "设置"
  })
};

//头像上传
exports.doAvatar = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.uploadDir = './avatar/';
  form.parse(req, function (err, fileds, files) {
    var oldpath = files.avatar.path;
    var newname = req.session.username + path.extname(files.avatar.name);
    var newpath = form.uploadDir + newname;
    fs.rename(oldpath, newpath, function () {
      //更改数据库中的对象
      db.update('users', {username: req.session.username}, {$set: {"avatar": newname}}, function (err, result) {
        if (err) {
          console.log("更新头像失败");
          return;
        }
        req.session.avatar = newname;
        //渲染页面，传递avatar参数
        res.render('cut', {
          avatar: newname
        })
      });
    })
  })
};

//切图功能
exports.doCut = function (req, res, next) {
  var {w, h, l, t}=req.query;
  gm('./avatar/' + req.session.avatar)
    .crop(w, h, l, t)
    .resize(200, 200, "!")
    .write('./avatar/' + req.session.avatar, function (err) {
      if (err) {
        res.send({"bok": false, "msg": "切图失败"})
      } else {
        res.send({"bok": true, "msg": "切图成功"})
      }
    })
};

//执行提交留言功能
exports.submit = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fileds) {
    fileds.username = req.session.username;
    fileds.avatar = req.session.avatar;
    fileds.time = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    db.insert('messages', fileds, function (err, result) {
      if (err) {
        res.send({"bok": false, "msg": "留言提交失败"})
      } else {
        res.send({"bok": true, "msg": "留言提交成功"})
      }
    });
  })
};

//获取所有留言
exports.getAllData = function (req, res, next) {
  var {page, pageamount}=req.query;
  //到数据库中查找所有留言
  db.find('messages', {}, {sort: {"time": -1}, page, pageamount}, function (err, result) {
    if (err) {
      res.send({"bok": false, "msg": "留言获取失败"});
    } else {
      res.send({"bok": true, "msg": result});
    }
  })
};

//获取总页数
exports.paging = function (req, res, next) {
  db.allCount('messages', function (count) {
    res.send(count.toString())
  })
};

//删除当前留言
exports.delete = function (req, res, next) {
  var _id=ObjectId(req.params.id);
  db.remove("messages",{_id},function (err, result) {
    if(err){
      console.log('删除失败');
      return;
    }
    res.redirect('/');
  })
};

//显示详情页面
exports.detail=function (req, res, next) {
  var _id=ObjectId(req.params.id);
  db.find('messages',{_id},function (err, result) {
    console.log(result);
    res.render('detail',{
      login: req.session.login ? true : false,
      username: req.session.login ? req.session.username : '',
      current:'',
      title:result[0].title,
      content:result[0].content,
      avatar:result[0].avatar,
      time:result[0].time,
    });
  })
};

//获取当前登录用户的说说
exports.myTalk=function (req, res, next) {
  db.find("messages",{"username":req.session.username},{sort: {"time": -1}},function (err, talk) {
    res.render("myTalk",{
      talk,
      current:"说说",
      login: req.session.login ? true : false,
      username: req.session.login ? req.session.username : '',
    })
  })
};

//获取所有用户列表
exports.userList=function (req, res, next) {
  db.find("users",{},function (err, result) {
    if(!err){
      res.render("userList",{
        current:"列表",
        login: req.session.login ? true : false,
        username: req.session.login ? req.session.username : '',
        talk:result
      })
    }
  })
};



