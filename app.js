// 应用程序的启动入口文件


// 加载express模块
var express=require('express');

// 创建app应用=>NodeJS Http.createServer();
var app=express();

var path=require('path');

// 加载cookies模块
var cookies=require('cookies')

// 加载数据库模块
const mysql=require('mysql');

// 加载body-parser 用来处理post提交过来的数据
const bodyParser=require('body-parser');

//获取post请求的数据
app.use(bodyParser.urlencoded());
//这个方法会给前端传递过来的req里面加上一个body属性 将post提交过来的数据
//放到这个body属性中

//连接数据库
var db=mysql.createPool({host:'localhost',user:'root',password:'cmy19961106',database:'myblognode'})

// 加载模板处理模块
var swig=require('swig');


// 设置cookie
// 中间件  无论什么时候用户来访问我们的站点，都会先走这个中间件
app.use((req, res, next)=>{
    req.cookies = new cookies(req, res);//然后就可以通过req.cookies对象下的set和get方法来设置和获取cookie

    /**
    * 解析登录用户的cookie信息
    * 那么我们解析完登录信息之后  如何让他显示登录成功的页面呢？此时需要模板来实现
    */
    
    // 给req设置一个对象 任意路由都可以访问  因为无论访问该站点下的那个页面 都会走这个逻辑
    req.userInfo = {};
    if( req.cookies.get('userInfo') ){//如果浏览器如果之前登陆过 那么服务端是会给浏览器一个信物cookies的 当再次访问该站点时 浏览器会把信物cookies
                                    //放在请求头中发送给服务器  服务器就知道它之前已经登陆过了 所以我们可以通过判断req请求头中
                                    //是否有cookie来判断是否之前登陆过
        try {
            req.userInfo = JSON.parse( req.cookies.get('userInfo') );//因为cookie是字符串类型  所以要先将它解析为对象

             // 获取当前登录用户的类型，是否是管理员,即查找对应的id 判断isAdmin
            db.query(`SELECT * FROM user_table WHERE user_id='${req.userInfo._id}'`,(err,data)=>{
                if(data.length!=0){//如果能够查询到当前id对应的用户
                    req.userInfo.isAdmin = Boolean( data[0].isAdmin );//那么将查询到的用户类型赋值给req.userInfo.isAdmin
                    next();
                }
            })

        } catch (error) {
            next();
        }
    }else{
        // 随便访问这个站点下的任意页面  都会走这个逻辑
       // console.log('cookie',typeof req.cookies.get('userInfo'));//string
        next();
    }
});


// 配置应用模板
// 定义当前应用所使用的模板引擎 
// 第一个参数：模板引擎的名称 同时也是模板文件的后缀，第二个参数表示用于解析处理模板内容的方法
app.engine('html',swig.renderFile);
// 设置模板文件存放的目录 第一个参数必须是views 第二个参数是路径
app.set('views','./views');
// 注册所使用的模板引擎 第一个参数必须是view engine 第二个参数和app.engine()此方法中定义的第一个参数一致，也就是app.engine()这个方法中定义的模板引擎的名称一致
app.set('view engine','html');

// 在开发过程中，需要取消模板缓存
swig.setDefaults({cache:false});

/**
 * 根据不同的功能划分模块
 */
// 如果用户访问路径以admin开头 那么就把它扔给routers文件夹下的admin路由来处理 /admin表示绝对路径
app.use('/admin',require('./routers/admin'));
app.use('/api',require('./routers/api'));
app.use('/',require('./routers/main'));

// 设置静态文件托管
// 当用户访问的url是以public开始  那么直接返回对应的__dirname+'/public'下的文件
//Request URL: http://localhost:8081/main.css
// 这里的public和href里面的路径相匹配
app.use(express.static(path.join(__dirname, 'public')))//public 


// 监听http请求
app.listen(8081);