var express=require('express');
var router=express.Router();
const cookies=express('cookies');
const mysql=require('mysql');

var db=mysql.createPool({host:'localhost',user:'root',password:'cmy19961106',database:'myblognode'})

//统一返回格式
var responseData;

// 初始化返回格式
router.use(function(req,res,next){
    responseData={
        code:0,//表示没有错误
        message:''
    }

    next();
})

/**
 * 用户注册
 * 注册的逻辑
 * 1、用户名不能为空
 * 2、密码不能为空
 * 3、两次输入密码必须一致
 * 
 * 1、用户是否已经被注册  数据库查询
 */
router.post('/user/register',function(req,res,next){
    
    var username=req.body.username;
    var password=req.body.password;
    var repassword=req.body.repassword;
    const reg = /^[^<>"'$\|?~*&@(){}]*$/;
    
    // 用户名是否为空
    if(username==''){
        responseData.code=1;
        responseData.message='用户名不能为空';
        res.json(responseData);//将responseData对象转换为json格式  返回给前端
        return
    }

    // 用户名不能含有特殊字符
    if(!reg.test(username)){
        responseData.code=1;
        responseData.message='用户名不能含有特殊字符';
        res.json(responseData);
        return;
    }

    // 密码不能为空
    if(password==''){
        responseData.code=2;
        responseData.message='密码不能为空';
        res.json(responseData);//将responseData对象转换为json格式  返回给前端
        return
    }

    // 密码不能含有特殊字符
    if(!reg.test(password)){
        responseData.code=2;
        responseData.message='密码不能含有特殊字符';
        res.json(responseData);
        return;
    }

    // 如果两次输入的密码必须一致
    if(password!=repassword){
        responseData.code=3;
        responseData.message='两次密码不一致';
        res.json(responseData);
        return
    }

    // 用户名是否已经被注册了，如果数据库中已经存在了和我们要注册的用户名同名的数据 那么说明该用户名已经被注册了
    db.query(`SELECT * FROM user_table WHERE username='${username}'`,(err,data)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            if(data.length!=0){//表示数据库中有该记录
                responseData.code=4;
                responseData.message='用户名已经被注册了';
                res.json(responseData);
                return
            }else{//将用户注册信息插入到user_table表中
                db.query(`INSERT INTO user_table (username,password) VALUES ('${username}','${password}')`,(err,data)=>{
                    // 注册成功
                    console.log(111);
                    responseData.message='注册成功';
                    res.json(responseData);
                    return
                })
            }
        }
    })

    
})

/*
    1、用户登录
*/ 

router.post('/user/login',function(req,res){
    var username=req.body.username;
    var password=req.body.password;
    if(username==''||password==''){
        responseData.code=1;
        responseData.message='用户名或者密码不能为空';
        res.json(responseData);
        return
    }

    // 查询数据库中相同的用户名和密码的记录是否存在，如果存在则登录成功
    db.query(`SELECT * FROM user_table WHERE username='${username}'`,(err,data)=>{
        if(err){
            res.status(500).send('database err').end()
        }else{
            if(data.length==0){
                responseData.code=2;
                responseData.message='用户名或密码错误';
                res.json(responseData);
                return
            }else{
                if(data[0].password==password){//用户名和密码正确
                   
                    console.log(data);

                     // 还要返回用户的登录信息  因为要显示在页面上
                    responseData.userInfo={
                        _id:data[0].user_id,
                        username:data[0].username,
                        isAdmin:data[0].isAdmin
                    }

                    // 如果登录成功  给浏览器发送一个cookies  浏览器得到cookies信息之后会保存起来 以后只要访问此站点都会将保存的cookie信息
                    //以头信息的方式发送给服务端  那么服务端就可以得到cookies信息  通过这个cookies信息来验证我们是否为登录状态
                    req.cookies.set('userInfo',JSON.stringify({
                        _id:data[0].user_id,
                        username:data[0].username
                    }))

                    responseData.message='登录成功';
                    res.json(responseData);
                    return
                }
            }
        }
    })
})

/**
 * 退出
 */
    router.get('/user/loginout',function(req,res){
        req.cookies.set('userInfo',null);
        res.json(responseData);
    })

/**
 * 评论提交
 */
router.post('/comment/post',function(req,res){
    
    //文章的Id 要知道文章的Id才知道这些评论是和哪篇文章关联

    var articleId=req.body.articleId || '' ;
    console.log('articleId',articleId);

    var postData={
        username:req.userInfo.username,
        content:req.body.content
    }

    
    db.query(`SELECT * FROM content_table WHERE id='${articleId}'`,(err,article)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            if(article.length!=0){
                article[0].count++;

                // console.log('view',article[0].view);

                db.query(`UPDATE content_table SET count='${article[0].count}' WHERE id='${articleId}'`,(err,view)=>{
                    if(err){
                        res.status(500).send('database err').end();
                    }else{
                      
                    }
                    
                })
                
            }
        }
    })
  // 插入当前提交的评论到评论表中
    db.query(`INSERT INTO comment_table (username,content,articleId) VALUES ('${postData.username}','${postData.content}','${articleId}')`,(err,data)=>{
        if(err){
            res.status(500).send('database err').end();
        }else{
            // 找到该评论表中关于该文章的所有评论
            db.query(`SELECT * FROM comment_table WHERE articleId='${articleId}' ORDER BY id DESC`,(err,comments)=>{
                if(err){
                    res.status(300).send('database err').end();
                }else{
                    if(comments.length>=0){
                        console.log('comments',comments);
                        responseData.message='评论成功';
                        // 该文章对应的所有评论信息
                        responseData.data=comments;
                        res.json(responseData);
                    }
                }
            })
        }
    })

})

/**
 * 渲染页面的时候获取指定文章的所有评论
 */
router.get('/comment',(req,res)=>{

    // 通过get方式传递 所以获取传递过来的参数时用到req.query.articleId
    var articleId=req.query.articleId || '' ;
    // 找到该评论表中关于该文章的所有评论
    db.query(`SELECT * FROM comment_table WHERE articleId='${articleId}' ORDER BY id DESC`,(err,comments)=>{
        if(err){
            res.status(300).send('database err').end();
        }else{
            if(comments.length>=0){
                console.log('comments',comments);
                responseData.message='评论成功';
                // 该文章对应的所有评论信息传递给前台
                responseData.data=comments;
                res.json(responseData);
            }
        }
    })
})


module.exports=router;